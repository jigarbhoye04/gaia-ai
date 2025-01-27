### Start app using

> uvicorn main:app --reload

.venv/Scripts/activate; uvicorn app.main:app --reload
.venv311/Scripts/activate; uvicorn app.main:app --reload

python 3.11.9

docker build -t gaia .
docker tag gaia:latest aryanranderiya/gaia
docker push aryanranderiya/gaia
docker run -p 8000:8000 gaia

> full command:

docker build -t gaia .;docker tag gaia:latest aryanranderiya/gaia;docker push aryanranderiya/gaia;
