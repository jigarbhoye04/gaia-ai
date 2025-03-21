from celery import Celery

# pyamqp : RabbitMQ protocol
app = Celery("tasks", backend="rpc://", broker="pyamqp://guest@localhost//")


@app.task
def add(x, y):
    return x + y


result = add.delay(4, 4)

print(result.ready())
print(result.get(timeout=1))
