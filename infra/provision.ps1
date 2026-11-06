<#
.SYNOPSIS
Creates the Azure resources for the gift ideas demo: Cosmos DB for MongoDB (RU,
serverless), a Linux App Service plan and a web app.

.EXAMPLE
az login
.\infra\provision.ps1 -ResourceGroup rg-gift-ideas -Location swedencentral
#>
param(
  [string]$ResourceGroup = "rg-gift-ideas",
  [string]$Location = "swedencentral",
  [string]$NamePrefix = "gift-ideas",
  [string]$AppServiceSku = "B1"
)
$ErrorActionPreference = "Stop"

Write-Host "Creating resource group '$ResourceGroup' in $Location..."
az group create --name $ResourceGroup --location $Location --output none

Write-Host "Deploying Bicep template..."
az deployment group create `
  --resource-group $ResourceGroup `
  --name main `
  --template-file (Join-Path $PSScriptRoot "main.bicep") `
  --parameters namePrefix=$NamePrefix appServiceSku=$AppServiceSku `
  --query "properties.outputs" `
  --output json

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. .\infra\setup-github-oidc.ps1 -ResourceGroup $ResourceGroup   # wires GitHub Actions deployment"
Write-Host "  2. Push to main (or run the workflow manually) to deploy the application code."
Write-Host "  3. Seed the database once:"
Write-Host "     `$env:MONGODB_URI = az cosmosdb keys list -g $ResourceGroup -n <cosmosAccountName> --type connection-strings --query \"connectionStrings[0].connectionString\" -o tsv"
Write-Host "     npm run db:seed -w api"
