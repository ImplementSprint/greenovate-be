@echo off
echo Starting all SCM (System 3) Microservices...

start "SCM Auth User Access (3020)" cmd /k "cd apps\auth-user-access-service && npm run dev"
start "SCM Cycle Counting (3021)" cmd /k "cd apps\cycle-counting-service && npm run dev"
start "SCM Discrepancy QC (3022)" cmd /k "cd apps\discrepancy-qc-service && npm run dev"
start "SCM Distribution (3023)" cmd /k "cd apps\distribution-service && npm run dev"
start "SCM Document (3024)" cmd /k "cd apps\document-service && npm run dev"
start "SCM Inventory (3025)" cmd /k "cd apps\inventory-service && npm run dev"
start "SCM Notification (3026)" cmd /k "cd apps\notification-service && npm run dev"
start "SCM Procurement (3027)" cmd /k "cd apps\procurement-service && npm run dev"
start "SCM Product Catalog (3028)" cmd /k "cd apps\product-catalog-service && npm run dev"
start "SCM Reporting Analytics (3029)" cmd /k "cd apps\reporting-analytics-service && npm run dev"
start "SCM Risk Compliance (3030)" cmd /k "cd apps\risk-compliance-service && npm run dev"
start "SCM Stock Adjustment (3031)" cmd /k "cd apps\stock-adjustment-service && npm run dev"
start "SCM Supplier (3032)" cmd /k "cd apps\supplier-service && npm run dev"
start "SCM Warehouse Receiving (3033)" cmd /k "cd apps\warehouse-receiving-service && npm run dev"
start "SCM API Gateway (3034)" cmd /k "cd apps\scm-api-gateway && npm run start:dev"

echo All 15 SCM services are opening in new terminal windows on ports 3020 - 3034!
