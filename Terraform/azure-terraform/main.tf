# Combined Azure + AWS Terraform for DALScooter Project
# Modules 2 & 3: Virtual Assistant + Message Passing

# Azure Provider
provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

# AWS Provider  
provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# Variables
variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "aws_access_key" {
  description = "AWS Access Key"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dalscooter"
}

# =============================================================================
# AZURE RESOURCES (Module 2: Virtual Assistant)
# =============================================================================

resource "azurerm_resource_group" "rg" {
  name     = "rg-dalscooter-bot"
  location = "Canada Central"
}

resource "azurerm_storage_account" "sa" {
  name                     = "dalscooterfuncsa01"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "plan" {
  name                = "dalscooter-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "function" {
  name                       = "dalscooter-botfunc"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  service_plan_id            = azurerm_service_plan.plan.id
  storage_account_name       = azurerm_storage_account.sa.name
  storage_account_access_key = azurerm_storage_account.sa.primary_access_key

  site_config {
    application_stack {
      python_version = "3.10"
    }
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "python"
    WEBSITE_RUN_FROM_PACKAGE = "0"
    # AWS Credentials for DynamoDB access
    AWS_ACCESS_KEY           = var.aws_access_key
    AWS_SECRET_KEY           = var.aws_secret_key
    AWS_REGION              = var.aws_region
  }
}

# Azure Bot Service
resource "azurerm_bot_service_azure_bot" "bot" {
  name                = "dalscooter-bot"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "global"
  microsoft_app_id    = azurerm_bot_service_azure_bot.bot.microsoft_app_id
  sku                 = "F0"
  endpoint            = "https://${azurerm_linux_function_app.function.name}.azurewebsites.net/api/message_handler"
}

# =============================================================================
# AWS RESOURCES (Module 3: Message Passing)
# =============================================================================

# DynamoDB Tables
resource "aws_dynamodb_table" "bookings" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "booking_id"

  attribute {
    name = "booking_id"
    type = "S"
  }

  tags = {
    Name        = "DALScooter-Bookings"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "customer_issues" {
  name           = "CustomerIssues"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "DALScooter-CustomerIssues"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "message_logs" {
  name           = "MessageLogs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "message_id"

  attribute {
    name = "message_id"
    type = "S"
  }

  tags = {
    Name        = "DALScooter-MessageLogs"
    Environment = "dev"
  }
}

# SQS Queue for Message Passing
resource "aws_sqs_queue" "customer_complaints" {
  name                      = "CustomerComplaints"
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 1209600  # 14 days
  receive_wait_time_seconds = 10

  tags = {
    Name        = "DALScooter-CustomerComplaints"
    Environment = "dev"
  }
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda Functions
resource "aws_iam_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.bookings.arn,
          aws_dynamodb_table.customer_issues.arn,
          aws_dynamodb_table.message_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.customer_complaints.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda Function: Message Publisher
resource "aws_lambda_function" "message_publisher" {
  filename         = "message_publisher.zip"
  function_name    = "MessagePublisher"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.customer_complaints.url
      MESSAGE_LOGS_TABLE = aws_dynamodb_table.message_logs.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.message_publisher_logs,
  ]
}

# Lambda Function: Message Processor  
resource "aws_lambda_function" "message_processor" {
  filename         = "message_processor.zip"
  function_name    = "MessageProcessor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      MESSAGE_LOGS_TABLE = aws_dynamodb_table.message_logs.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.message_processor_logs,
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "message_publisher_logs" {
  name              = "/aws/lambda/MessagePublisher"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "message_processor_logs" {
  name              = "/aws/lambda/MessageProcessor"
  retention_in_days = 14
}

# SQS Trigger for Message Processor Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.customer_complaints.arn
  function_name    = aws_lambda_function.message_processor.arn
  batch_size       = 1
}

# Sample data for Bookings table
resource "aws_dynamodb_table_item" "sample_booking_1" {
  table_name = aws_dynamodb_table.bookings.name
  hash_key   = aws_dynamodb_table.bookings.hash_key

  item = jsonencode({
    booking_id = {
      S = "ABC123"
    }
    bike_id = {
      S = "BIKE001"
    }
    access_code = {
      S = "UNLOCK456"
    }
    duration = {
      S = "2 hours"
    }
    bike_type = {
      S = "eBike"
    }
  })
}

resource "aws_dynamodb_table_item" "sample_booking_2" {
  table_name = aws_dynamodb_table.bookings.name
  hash_key   = aws_dynamodb_table.bookings.hash_key

  item = jsonencode({
    booking_id = {
      S = "XYZ789"
    }
    bike_id = {
      S = "BIKE002"
    }
    access_code = {
      S = "UNLOCK789"
    }
    duration = {
      S = "1 hour"
    }
    bike_type = {
      S = "Segway"
    }
  })
}

# =============================================================================
# OUTPUTS
# =============================================================================

# Azure Outputs
output "azure_resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "azure_function_app_name" {
  value = azurerm_linux_function_app.function.name
}

output "azure_bot_name" {
  value = azurerm_bot_service_azure_bot.bot.name
}

# AWS Outputs
output "aws_bookings_table_name" {
  value = aws_dynamodb_table.bookings.name
}

output "aws_customer_issues_table_name" {
  value = aws_dynamodb_table.customer_issues.name
}

output "aws_message_logs_table_name" {
  value = aws_dynamodb_table.message_logs.name
}

output "aws_sqs_queue_url" {
  value = aws_sqs_queue.customer_complaints.url
}

output "aws_message_publisher_function_name" {
  value = aws_lambda_function.message_publisher.function_name
}

output "aws_message_processor_function_name" {
  value = aws_lambda_function.message_processor.function_name
}