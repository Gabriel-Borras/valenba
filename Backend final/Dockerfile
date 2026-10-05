FROM python:3.10

# Configurar usuario sin privilegios para Hugging Face Spaces
RUN useradd -m -u 1000 user

# Establecer directorio de trabajo
WORKDIR /code

# Copiar requirements y hacer la instalación
COPY --chown=user requirements.txt /code/
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiar el resto de los archivos
COPY --chown=user . /code/

# Ejecutar como usuario 'user'
USER user

# Exponer el puerto 7860 (estándar de Hugging Face Spaces)
EXPOSE 7860

# Cambiar al directorio del backend para que los imports funcionen sin modificar código
WORKDIR /code/Backend Final

# Comando para iniciar FastAPI
CMD ["uvicorn", "API:app", "--host", "0.0.0.0", "--port", "7860"]
