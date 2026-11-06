<#
.SYNOPSIS
Creates a Microsoft Entra app registration with GitHub OIDC federated
credentials and grants it deployment rights to the web app, then stores the
required secrets/variables in the GitHub repository for the deploy workflow.

Requires: az login, gh auth login, and a completed .\provision.ps1 run.

.EXAMPLE
.\infra\setup-github-oidc.ps1 -ResourceGroup rg-gift-ideas
#>
param(
  [string]$ResourceGroup = "rg-gift-ideas",
  [string]$AppRegistrationName = "github-gift-ideas-deploy",
  [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"

$repo = gh repo view --json nameWithOwner --jq ".nameWithOwner"
if (-not $repo) { throw "Could not resolve the GitHub repository; run 'gh auth login' first." }

$subscriptionId = az account show --query id -o tsv
$tenantId = az account show --query tenantId -o tsv
$webAppName = az deployment group show -g $ResourceGroup -n main --query "properties.outputs.webAppName.value" -o tsv
if (-not $webAppName) { throw "Deployment outputs not found; run provision.ps1 first." }

Write-Host "Creating app registration '$AppRegistrationName'..."
$appId = az ad app create --display-name $AppRegistrationName --query appId -o tsv
az ad sp create --id $appId --output none 2>$null

Write-Host "Adding federated credential for $repo ($Branch)..."
$federated = @{
  name = "github-$Branch"
  issuer = "https://token.actions.githubusercontent.com"
  subject = "repo:${repo}:ref:refs/heads/$Branch"
  audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress
$federated | az ad app federated-credential create --id $appId --parameters "@-" --output none

Write-Host "Granting 'Website Contributor' on resource group '$ResourceGroup'..."
az role assignment create `
  --assignee $appId `
  --role "Website Contributor" `
  --scope "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup" `
  --output none

Write-Host "Storing GitHub secrets and variables in $repo..."
gh secret set AZURE_CLIENT_ID --body $appId
gh secret set AZURE_TENANT_ID --body $tenantId
gh secret set AZURE_SUBSCRIPTION_ID --body $subscriptionId
gh variable set AZURE_WEBAPP_NAME --body $webAppName

Write-Host ""
Write-Host "Done. Push to '$Branch' or run the 'Deploy to Azure' workflow to deploy."
