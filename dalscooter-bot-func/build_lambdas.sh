#!/bin/bash

# Create message_publisher.zip
cd lambda_functions/message_publisher
zip -r ../../message_publisher.zip .
cd ../..

# Create message_processor.zip  
cd lambda_functions/message_processor
zip -r ../../message_processor.zip .
cd ../..

echo "Lambda ZIP files created!"