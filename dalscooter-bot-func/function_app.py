import azure.functions as func
from azure.cosmos import CosmosClient
import logging
import os
import uuid
import datetime
import json 

app = func.FunctionApp()

# 🧾 Register Help Endpoint
@app.route(route="register_help", auth_level=func.AuthLevel.ANONYMOUS)
def register_help(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        "To register, visit the signup page and complete the 3-step login:\n"
        "1. Email + Password\n"
        "2. Security Question\n"
        "3. Caesar Cipher challenge",
        mimetype="text/plain"
    )

# 🔍 Booking Lookup Endpoint
@app.route(route="get_booking_details", auth_level=func.AuthLevel.ANONYMOUS)
def get_booking_details(req: func.HttpRequest) -> func.HttpResponse:
    booking_ref = req.params.get("ref")

    if not booking_ref:
        return func.HttpResponse("Missing booking reference.", status_code=400)

    cosmos_endpoint = os.environ["COSMOS_ENDPOINT"]
    cosmos_key = os.environ["COSMOS_KEY"]
    client = CosmosClient(cosmos_endpoint, cosmos_key)

    db = client.get_database_client("dalscooterdb")
    container = db.get_container_client("bookings")

    query = f"SELECT * FROM c WHERE LOWER(c.booking_id) = '{booking_ref.lower()}'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))

    if items:
        booking = items[0]
        return func.HttpResponse(
            f"Booking found:\nBike: {booking['bike_id']}\nAccess Code: {booking['access_code']}\nDuration: {booking['duration']}",
            mimetype="text/plain"
        )
    else:
        return func.HttpResponse("Booking reference not found.", status_code=404)


# 📝 Customer Issue Submission Endpoint
@app.route(route="submit_issue", auth_level=func.AuthLevel.ANONYMOUS)
def submit_issue(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
        user_id = data.get("user_id")
        message = data.get("message")
    except:
        return func.HttpResponse("Invalid JSON body.", status_code=400)

    if not user_id or not message:
        return func.HttpResponse("Missing 'user_id' or 'message'", status_code=400)

    # CosmosDB integration
    cosmos_endpoint = os.environ["COSMOS_ENDPOINT"]
    cosmos_key = os.environ["COSMOS_KEY"]
    client = CosmosClient(cosmos_endpoint, cosmos_key)

    db = client.get_database_client("dalscooterdb")
    container = db.get_container_client("customer_issues")

    item = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

    container.create_item(item)
    return func.HttpResponse("Issue submitted successfully.", status_code=200)


@app.route(route="message_handler", auth_level=func.AuthLevel.ANONYMOUS)
def message_handler(req: func.HttpRequest) -> func.HttpResponse:
    import json, os
    from azure.cosmos import CosmosClient
    import uuid, datetime

    try:
        activity = req.get_json()
        user_message = activity.get("text", "").lower()
    except Exception:
        return func.HttpResponse("Invalid Bot Framework request.", status_code=400)

    cosmos_endpoint = os.environ["COSMOS_ENDPOINT"]
    cosmos_key = os.environ["COSMOS_KEY"]
    client = CosmosClient(cosmos_endpoint, cosmos_key)
    db = client.get_database_client("dalscooterdb")

    # ✨ Booking Lookup
    if user_message.startswith("ref="):
        booking_ref = user_message.replace("ref=", "").strip()
        container = db.get_container_client("bookings")
        query = f"SELECT * FROM c WHERE LOWER(c.booking_id) = '{booking_ref.lower()}'"
        items = list(container.query_items(query=query, enable_cross_partition_query=True))

        if items:
            booking = items[0]
            reply_text = (
                f"Booking found:\nBike: {booking['bike_id']}\n"
                f"Access Code: {booking['access_code']}\n"
                f"Duration: {booking['duration']}"
            )
        else:
            reply_text = "Booking reference not found."

    # ✨ Feedback Submission
    elif user_message.startswith("feedback:"):
        message = user_message.replace("feedback:", "").strip()
        container = db.get_container_client("customer_issues")
        container.create_item({
            "id": str(uuid.uuid4()),
            "user_id": "anonymous",
            "message": message,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        reply_text = "Thank you for your feedback! We've noted your issue."

    # ✨ Registration Help
    elif "register" in user_message:
        reply_text = (
            "To register, visit the signup page and complete the 3-step login:\n"
            "1. Email + Password\n"
            "2. Security Question\n"
            "3. Caesar Cipher challenge"
        )

    # ✨ Greetings
    elif "hi" in user_message or "hello" in user_message:
        reply_text = "Hi there! How can I help you today?"

    # ✨ Fallback
    else:
        reply_text = (
            "Sorry, I didn’t understand that. You can say things like:\n"
            "- ref=123ABC\n"
            "- feedback: the scooter was broken\n"
            "- how do I register?"
        )

    response_activity = {
        "type": "message",
        "text": reply_text
    }

    return func.HttpResponse(
        json.dumps(response_activity),
        mimetype="application/json"
    )


