from tortoise import fields
from tortoise.models import Model


class Filial(Model):
    """Филиал — отделение библиотеки."""
    id = fields.IntField(pk=True)                       # ID_филиала
    name = fields.CharField(max_length=255)             # Название (не пустое)
    address = fields.CharField(max_length=500)          # Адрес (не пустое)

    class Meta:
        table = "filial"

    def __str__(self):
        return self.name


class Rack(Model):
    """Стеллаж — место физического хранения книг внутри филиала."""
    id = fields.IntField(pk=True)                       # ID_стеллажа
    coordinates = fields.CharField(max_length=255)      # Координаты (например, «Ряд 3, Секция 2»)
    room_number = fields.CharField(max_length=50)       # Номер_комнаты
    # Один филиал содержит много стеллажей (1:N). Удаление филиала со стеллажами запрещено.
    filial = fields.ForeignKeyField(
        "models.Filial", related_name="racks", on_delete=fields.RESTRICT
    )

    class Meta:
        table = "rack"

    def __str__(self):
        return f"Стеллаж #{self.id} ({self.coordinates})"


class Book(Model):
    """Книга — библиографические сведения об издании (без привязки к экземпляру)."""
    id = fields.IntField(pk=True)                       # ID_книги
    name = fields.CharField(max_length=500)             # Название (не пустое)
    author = fields.CharField(max_length=255)           # Автор (не пустое)
    year_of_publication = fields.IntField()             # Год_издания (четырёхзначный)
    genre = fields.CharField(max_length=255, null=True) # Жанр (может быть пустым)

    class Meta:
        table = "book"

    def __str__(self):
        return self.name


class Copy(Model):
    """Экземпляр — конкретный физический экземпляр книги."""
    id = fields.IntField(pk=True)                       # ID_экземпляра
    # Одна книга имеет много экземпляров (1:N). Удаление книги с экземплярами запрещено.
    book = fields.ForeignKeyField(
        "models.Book", related_name="copies", on_delete=fields.RESTRICT
    )
    status = fields.CharField(max_length=50)            # Статус: «на руках» / «в наличии» / «списан»
    condition = fields.CharField(max_length=50)         # Состояние: «хорошее» / «удовлетворительное» / «плохое»
    # Один стеллаж хранит много экземпляров (1:N). Может быть пустым (экземпляр на руках).
    # При удалении стеллажа ID_стеллажа обнуляется (SET NULL), а не удаляется запись.
    rack = fields.ForeignKeyField(
        "models.Rack", related_name="copies", on_delete=fields.SET_NULL, null=True
    )

    class Meta:
        table = "copy"

    def __str__(self):
        return f"Экземпляр #{self.id}"


class Reader(Model):
    """Читатель — личные данные читателя библиотеки."""
    id = fields.IntField(pk=True)                       # ID_читателя
    full_name = fields.CharField(max_length=255)        # ФИО (не пустое)
    birth_date = fields.DateField()                     # Дата_рождения (не пустое)
    passport_data = fields.CharField(max_length=100, unique=True)  # Паспортные_данные (уникальное)
    discharge_date = fields.DateField(null=True)        # Дата_выписки (заполняется при выписке)
    profession = fields.CharField(max_length=100, null=True)       # Профессия (может быть пустым)
    status = fields.CharField(max_length=50)            # Статус: «активный» / «выписан»

    class Meta:
        table = "reader"

    def __str__(self):
        return self.full_name


class Registration(Model):
    """Регистрация — факт записи читателя в филиал (связь M:N Читатель↔Филиал)."""
    id = fields.IntField(pk=True)                       # ID_регистрации
    reader = fields.ForeignKeyField(
        "models.Reader", related_name="registrations", on_delete=fields.RESTRICT
    )
    ticket_number = fields.CharField(max_length=50, unique=True)   # Номер_билета (уникальное)
    filial = fields.ForeignKeyField(
        "models.Filial", related_name="registrations", on_delete=fields.RESTRICT
    )
    registration_date = fields.DateField()             # Дата_регистрации (не пустое)

    class Meta:
        table = "registration"

    def __str__(self):
        return f"Регистрация #{self.id}"


class Loan(Model):
    """Формуляр — факт выдачи экземпляра книги читателю."""
    id = fields.IntField(pk=True)                       # ID_выдачи
    reader = fields.ForeignKeyField(
        "models.Reader", related_name="loans", on_delete=fields.RESTRICT
    )
    copy = fields.ForeignKeyField(
        "models.Copy", related_name="loans", on_delete=fields.RESTRICT
    )
    issue_date = fields.DateField()                     # Дата_выдачи (не пустое)
    planned_return_date = fields.DateField()           # Плановая_дата_возврата (не пустое)
    actual_return_date = fields.DateField(null=True)   # Фактическая_дата (после возврата)

    class Meta:
        table = "loan"

    def __str__(self):
        return f"Формуляр #{self.id}"
