import asyncio
import httpx
import time
import sys

# URL base configurada para apontar para o servidor local
API_URL = "http://localhost:8000/api/senhas/"
NUM_REQUESTS = 100
CONCURRENCY_LIMIT = 20

async def gerar_senha(client: httpx.AsyncClient, index: int, semaphore: asyncio.Semaphore):
    async with semaphore:
        # Alternando tipos para dar variedade ao load test
        tipos = ["ESPONTANEA", "AGENDADA", "RETORNO_ACOLHIMENTO", "VACINACAO"]
        tipo = tipos[index % len(tipos)]
        
        payload = {
            "tipo_atendimento": tipo,
            "cpf": None,
            "prioridade": 1 if index % 3 == 0 else 0
        }
        
        try:
            # Simulando o header do frontend
            response = await client.post(API_URL, json=payload, headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                data = response.json()
                print(f"[{index:03d}] ✅ Senha GERADA: {data.get('codigo')} ({tipo})")
                return True
            # Pode ocorrer 503 se o printer_mode for escpos e não houver impressora conectada
            elif response.status_code == 503:
                 print(f"[{index:03d}] ⚠️ Senha GERADA mas impressora falhou (503). Normal se sem impressora.")
                 return True
            else:
                print(f"[{index:03d}] ❌ Erro: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"[{index:03d}] ❌ Falha na requisição: {e}")
            return False

async def main():
    print(f"🚀 Iniciando Load Test - {NUM_REQUESTS} Requisições...")
    start_time = time.time()
    
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [gerar_senha(client, i, semaphore) for i in range(NUM_REQUESTS)]
        resultados = await asyncio.gather(*tasks)
        
    sucessos = sum(resultados)
    falhas = NUM_REQUESTS - sucessos
    
    end_time = time.time()
    duracao = end_time - start_time
    
    print("\n" + "="*40)
    print("📊 RESULTADO DO LOAD TEST")
    print("="*40)
    print(f"Total disparos : {NUM_REQUESTS}")
    print(f"Sucessos       : {sucessos}")
    print(f"Falhas         : {falhas}")
    print(f"Tempo total    : {duracao:.2f} segundos")
    print(f"Reqs / seg     : {NUM_REQUESTS / duracao:.2f} rps")
    print("="*40)
    
    if falhas > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
