from tortoise import fields
from tortoise.models import Model


class Filial(Model):
    """Филиал библиотеки"""
    id = fields.IntField(pk=True)
    address = fields.TextField()
    name_library = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "filial"

    def __str__(self):
        return self.name_library


class User(Model):
    """Читатель"""
    id = fields.IntField(pk=True)
    number_reading_ticket = fields.CharField(max_length=50, unique=True)
    passport_data = fields.TextField()
    professions = fields.CharField(max_length=100, null=True)
    gender = fields.CharField(max_length=10)
    years = fields.IntField()
    sing_in = fields.DateField()
    sing_out = fields.DateField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "users"

    def __str__(self):
        return self.number_reading_ticket


class Book(Model):
    """Книга"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=500)
    author = fields.CharField(max_length=255)
    year_of_publication = fields.IntField()
    topic = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "books"

    def __str__(self):
        return self.name


class Loan(Model):
    """Экземпляр книги"""
    id = fields.IntField(pk=True)
    id_book = fields.ForeignKeyField("models.Book", related_name="copies", on_delete=fields.CASCADE)
    id_filial = fields.ForeignKeyField("models.Filial", related_name="copies", on_delete=fields.CASCADE)
    status_condition = fields.CharField(max_length=100)  # хорошее / плохое / требует ремонта / списано
    status_free = fields.CharField(max_length=50)        # в библиотеке / на руках
    address = fields.TextField(null=True)
    nomer_room = fields.CharField(max_length=50, null=True)
    rack_coordination = fields.CharField(max_length=50, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "loan"

    def __str__(self):
        return f"Экземпляр #{self.id}"


class UserLoan(Model):
    """Формуляр (выдача книг)"""
    id = fields.IntField(pk=True)
    id_user = fields.ForeignKeyField("models.User", related_name="user_loans", on_delete=fields.CASCADE)
    id_loan = fields.ForeignKeyField("models.Loan", related_name="user_loans", on_delete=fields.CASCADE)
    id_filial = fields.ForeignKeyField("models.Filial", related_name="user_loans", on_delete=fields.CASCADE)
    date_issue = fields.DateField()
    date_return = fields.DateField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_loan"

    def __str__(self):
        return f"Формуляр #{self.id}"


class Catalog(Model):
    """Каталог"""
    id = fields.IntField(pk=True)
    id_book = fields.ForeignKeyField("models.Book", related_name="catalogs", on_delete=fields.CASCADE)
    catalog_type = fields.CharField(max_length=50)    # тематический / алфавитный
    catalog_value = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "catalog"

    def __str__(self):
        return f"{self.catalog_type}: {self.catalog_value}"


class BookTransaction(Model):
    """Поступление и списание книжного фонда"""
    id = fields.IntField(pk=True)
    id_loan = fields.ForeignKeyField("models.Loan", related_name="transactions", on_delete=fields.CASCADE)
    operation_type = fields.CharField(max_length=50)  # поступление / списание
    operation_date = fields.DateField()
    reason = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "book_transaction"

    def __str__(self):
        return f"{self.operation_type} #{self.id}"


class UserFilial(Model):
    """Регистрация читателя в филиале"""
    id = fields.IntField(pk=True)
    id_user = fields.ForeignKeyField("models.User", related_name="filial_registrations", on_delete=fields.CASCADE)
    id_filial = fields.ForeignKeyField("models.Filial", related_name="user_registrations", on_delete=fields.CASCADE)
    registration_date = fields.DateField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_filial"

    def __str__(self):
        return f"Регистрация #{self.id}"
