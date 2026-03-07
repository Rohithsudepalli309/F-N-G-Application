$root = "d:\MOBILE APPLICATION  DEV\F N G APPLICATION"
Set-Location $root

Write-Output "[1/3] Building backend image..."
$b1 = docker build -f "$root\backend\Dockerfile" --target production -t fngapplication-backend:latest "$root\backend" 2>&1
$b1 | Out-File "$root\docker_build_backend.log"
Write-Output "Backend build exit: $LASTEXITCODE"

Write-Output "[2/3] Building admin-dashboard image..."
$b2 = docker build -f "$root\apps\admin-dashboard\Dockerfile" --build-arg VITE_API_URL=http://localhost:3002/api/v1 -t "fngapplication-frontend-latest:admin" "$root\apps\admin-dashboard" 2>&1
$b2 | Out-File "$root\docker_build_admin.log"
Write-Output "Admin build exit: $LASTEXITCODE"

Write-Output "[3/3] Building merchant-dashboard image..."
$b3 = docker build -f "$root\apps\merchant-dashboard\Dockerfile" --build-arg VITE_API_URL=http://localhost:3002/api/v1 --build-arg VITE_SOCKET_URL=http://localhost:3002 -t "fngapplication-frontend-latest:merchant" "$root\apps\merchant-dashboard" 2>&1
$b3 | Out-File "$root\docker_build_merchant.log"
Write-Output "Merchant build exit: $LASTEXITCODE"

Write-Output "`nImages built:"
docker images --format "{{.Repository}}:{{.Tag}}`t{{.Size}}" | Select-String "fngapplication"
