from django.core.paginator import Paginator
from django.db.models import Q
from .models import Patient


def query_patients(
    search: str = "",
    gender: str = "",
    sort: str = "newest",
    page: int = 1,
    page_size: int = 8,
) -> dict:
    queryset = Patient.objects.all()

    if search:
        q = search.strip()
        queryset = queryset.filter(
            Q(name__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
        )

    if gender in {"Male", "Female", "Other"}:
        queryset = queryset.filter(gender=gender)

    order_map = {
        "oldest": "created_at",
        "name_asc": "name",
        "name_desc": "-name",
        "newest": "-created_at",
    }
    queryset = queryset.order_by(order_map.get(sort, "-created_at"))

    paginator = Paginator(queryset, max(1, min(page_size, 200)))
    page_obj = paginator.get_page(page)

    return {
        "count": paginator.count,
        "page": page_obj.number,
        "page_size": paginator.per_page,
        "total_pages": paginator.num_pages,
        "object_list": list(page_obj.object_list),
    }
