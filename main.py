def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        print("Ошибка: деление на ноль")
        return None
    return a / b

def calculator():
    print("Калькулятор")
    print("Операции: + - * /")

    while True:
        print("\nВведите 'выход' для завершения")
        a = input("Первое число: ")
        if a.lower() == "выход":
            break

        op = input("Операция (+, -, *, /): ")

        b = input("Второе число: ")
        if b.lower() == "выход":
            break

        try:
            a, b = float(a), float(b)
        except ValueError:
            print("Ошибка: введите числа")
            continue

        if op == "+":
            result = add(a, b)
        elif op == "-":
            result = subtract(a, b)
        elif op == "*":
            result = multiply(a, b)
        elif op == "/":
            result = divide(a, b)
        else:
            print("Ошибка: неизвестная операция")
            continue

        if result is not None:
            print(f"Результат: {a} {op} {b} = {result}")

if __name__ == "__main__":
    calculator()
