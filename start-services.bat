@echo off
echo Starting all POS Microservices and API Gateway...

start "API Gateway (3041)" cmd /k "set PORT=3041 && cd apps\api-gateway && npm run start:dev:POS-gateway"
start "Auth Service (3042)" cmd /k "set PORT=3042 && cd apps\auth-service && npm run start:dev:POS-auth"
start "Inventory Service (3043)" cmd /k "set PORT=3043 && cd apps\pos-inventory-service && npm run start:dev:POS-inventory"
start "Sales Service (3047)" cmd /k "set PORT=3047 && cd apps\sales-service && npm run start:dev:POS-sales"
start "Reporting Service (3045)" cmd /k "set PORT=3045 && cd apps\reporting-service && npm run start:dev:POS-reporting"
start "Role Service (3046)" cmd /k "set PORT=3046 && cd apps\role-service && npm run start:dev:POS-role"
start "Receipt Service (3044)" cmd /k "set PORT=3044 && cd apps\receipt-service && npm run start:dev:POS-receipt"
start "Transaction Service (3048)" cmd /k "set PORT=3048 && cd apps\transaction-service && npm run start:dev:POS-transaction"

echo All microservices are opening in new terminal windows on their 304x ports!
echo Make sure to keep your existing "npm run dev" window open for the frontend.
