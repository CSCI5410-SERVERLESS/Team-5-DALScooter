# import azure.functions as func
# from azure.cosmos import CosmosClient
# import os

# def main(req: func.HttpRequest) -> func.HttpResponse:
#     booking_ref = req.params.get("ref")
#     if not booking_ref:
#         return func.HttpResponse("Missing booking reference.", status_code=400)

#     cosmos_endpoint = os.environ["COSMOS_ENDPOINT"]
#     cosmos_key = os.environ["COSMOS_KEY"]
#     client = CosmosClient(cosmos_endpoint, cosmos_key)
#     db = client.get_database_client("dalscooterdb")
#     container = db.get_container_client("bookings")

#     query = f"SELECT * FROM c WHERE LOWER(c.booking_id) = '{booking_ref.lower()}'"
#     items = list(container.query_items(query=query, enable_cross_partition_query=True))

#     if items:
#         booking = items[0]
#         return func.HttpResponse(
#             f"Booking found:\nBike: {booking['bike_id']}\nAccess Code: {booking['access_code']}\nDuration: {booking['duration']}",
#             mimetype="text/plain"
#         )
#     else:
#         return func.HttpResponse("Booking reference not found.", status_code=404)
import azure.functions as func
from azure.cosmos import CosmosClient
import os
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    # Expect query parameter ?booking_id=123ABC
    booking_ref = req.params.get("booking_id")
    if not booking_ref:
        return func.HttpResponse(
            json.dumps({"error": "Missing booking reference."}),
            status_code=400,
            mimetype="application/json"
        )

    cosmos_endpoint = os.environ["COSMOS_ENDPOINT"]
    cosmos_key = os.environ["COSMOS_KEY"]
    client = CosmosClient(cosmos_endpoint, cosmos_key)
    db = client.get_database_client("dalscooterdb")
    container = db.get_container_client("bookings")

    query = f"SELECT * FROM c WHERE LOWER(c.booking_id) = '{booking_ref.lower()}'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))

    if items:
        booking = items[0]
        # Return JSON so React can parse it
        return func.HttpResponse(
            json.dumps({
                "booking_id": booking.get("booking_id", booking_ref),
                "scooter": booking.get("scooter", booking.get("bike_id", "Unknown")),
                "start_time": booking.get("start_time", "N/A"),
                "location": booking.get("location", "N/A"),
                "status": booking.get("status", "Active"),
                "duration": booking.get("duration", "Unknown"),
                "access_code": booking.get("access_code", "N/A")
            }),
            status_code=200,
            mimetype="application/json"
        )
    else:
        return func.HttpResponse(
            json.dumps({"error": "Booking reference not found."}),
            status_code=404,
            mimetype="application/json"
        )
