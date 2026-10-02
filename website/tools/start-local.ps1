$env:NOVEPORTE_FORTEZZA_PASSWORD = [Environment]::GetEnvironmentVariable('NOVEPORTE_FORTEZZA_PASSWORD', 'User')
$env:NOVEPORTE_WEBSITE_API_TOKEN = [Environment]::GetEnvironmentVariable('NOVEPORTE_WEBSITE_API_TOKEN', 'User')
$env:NOVEPORTE_APP_API_ORIGIN = [Environment]::GetEnvironmentVariable('NOVEPORTE_APP_API_ORIGIN', 'User')
$env:NOVEPORTE_APP_ASSET_ORIGIN = [Environment]::GetEnvironmentVariable('NOVEPORTE_APP_ASSET_ORIGIN', 'User')
if (-not $env:NOVEPORTE_FORTEZZA_PASSWORD -or -not $env:NOVEPORTE_WEBSITE_API_TOKEN -or -not $env:NOVEPORTE_APP_API_ORIGIN -or -not $env:NOVEPORTE_APP_ASSET_ORIGIN) {
    throw 'Configurazione locale del sito incompleta.'
}

npm start
