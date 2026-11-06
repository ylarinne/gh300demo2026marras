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
  [string]$Branch = "main",
  [string]$Environment = "production"
)
$ErrorActionPreference = "Stop"

$repoInfo = gh repo view --json nameWithOwner,id --jq "." | ConvertFrom-Json
$repo = $repoInfo.nameWithOwner
if (-not $repo) { throw "Could not resolve the GitHub repository; run 'gh auth login' first." }
$owner, $repoName = $repo -split "/"
# GitHub embeds numeric owner/repo ids in OIDC subject claims; resolve them for exact matching.
$ownerId = gh api "users/$owner" --jq ".id"
$repoId = gh api "repos/$repo" --jq ".id"

$subscriptionId = az account show --query id -o tsv
$tenantId = az account show --query tenantId -o tsv
$webAppName = az deployment group show -g $ResourceGroup -n main --query "properties.outputs.webAppName.value" -o tsv
if (-not $webAppName) { throw "Deployment outputs not found; run provision.ps1 first." }

Write-Host "Creating app registration '$AppRegistrationName'..."
$appId = az ad app create --display-name $AppRegistrationName --query appId -o tsv
az ad sp create --id $appId --output none 2>$null

Write-Host "Adding federated credentials for $repo..."
$subjectRepo = "repo:${owner}@${ownerId}/${repoName}@${repoId}"
$credentials = @(
  @{ name = "github-$Branch"; subject = "${subjectRepo}:ref:refs/heads/$Branch" },
  @{ name = "github-env-$Environment"; subject = "${subjectRepo}:environment:$Environment" }
)
$existing = az ad app federated-credential list --id $appId --query "[].name" -o tsv
foreach ($credential in $credentials) {
  if ($existing -contains $credential.name) {
    Write-Host "  $($credential.name) already exists, skipping."
    continue
  }
  $parameters = @{
    name = $credential.name
    issuer = "https://token.actions.githubusercontent.com"
    subject = $credential.subject
    audiences = @("api://AzureADTokenExchange")
  } | ConvertTo-Json -Compress
  $file = New-TemporaryFile
  Set-Content $file $parameters -Encoding ascii
  az ad app federated-credential create --id $appId --parameters "@$file" --output none
  Remove-Item $file
  Write-Host "  $($credential.name): $($credential.subject)"
}

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
