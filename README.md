# Gaia FastAPI Backend

### 🚀 **Running the App Locally**

```sh
uvicorn app.main:app --reload
```

<br/>

## 🐳 **Docker Usage**

### **1. Build and Push Docker Image**

```sh
docker build -t gaia .
docker tag gaia:latest aryanranderiya/gaia
docker push aryanranderiya/gaia
```

### **2. Run Docker Container**

```sh
docker run -p 8000:8000 gaia
```

## OR

### **1. Full Command (Chained Execution)**

```sh
docker build -t gaia .; docker tag gaia:latest aryanranderiya/gaia; docker push aryanranderiya/gaia;
```

<br/>
<br/>

---

## ⚡ **Production Deployment Workflow**

### **1. Switch to Production Branch**

```sh
git checkout -b prod
git pull origin prod
```

### **2. Merge Latest Changes from `main`**

```sh
git merge main
```

### **3. Push Changes to Production**

```sh
git push origin prod
```

<br/>
<br/>

---

## 📦 **UV Installation Commands**

> [!NOTE]
> Use `uv venv` **only outside Docker** when running locally.

### **Install Dependencies**

```sh
uv pip sync requirements.txt
```

### **Run Ruff Linter**

```sh
uvx ruff check
```
