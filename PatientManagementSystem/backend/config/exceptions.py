from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        message = "Request validation failed."
        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = str(response.data["detail"])
            elif response.data:
                first_val = next(iter(response.data.values()))
                if isinstance(first_val, list) and first_val:
                    message = str(first_val[0])
                else:
                    message = str(first_val)
        return Response(
            {
                "success": False,
                "message": message,
                "errors": response.data,
            },
            status=response.status_code,
        )

    return Response(
        {
            "success": False,
            "message": "An internal server error occurred.",
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
