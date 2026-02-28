$root = "d:\MOBILE APPLICATION  DEV\F N G APPLICATION"
Set-Location $root

Write-Output "[1/2] Building backend image..."
$b1 = docker build -f "$root\backend\Dockerfile" -t fng-backend:latest "$root\backend" 2>&1
$b1 | Out-File "$root\docker_build_backend.log"
Write-Output "Backend build exit: $LASTEXITCODE"

Write-Output "[2/2] Building admin-dashboard image..."
$b2 = docker build -f "$root\apps\admin-dashboard\Dockerfile" --build-arg VITE_API_URL=http://localhost:3000/api/v1 -t fng-admin:latest "$root\apps\admin-dashboard" 2>&1
$b2 | Out-File "$root\docker_build_admin.log"
Write-Output "Admin build exit: $LASTEXITCODE"

Write-Output "Images built:"
docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | Select-String "fng"
