# 直接执行 SQL 迁移脚本
# Direct SQL Migration Runner

# 数据库配置
$dbHost = "localhost"
$dbPort = 5432
$dbName = "gamehub"
$dbUser = "postgres"
$dbPassword = "5625709"

# SQL 文件路径
$sqlFile = ".\run-migration-direct.sql"

Write-Host "🔄 正在执行数据库迁移..." -ForegroundColor Cyan
Write-Host "📍 数据库: $dbHost`:$dbPort/$dbName" -ForegroundColor Gray

# 检查 SQL 文件是否存在
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL 文件不存在: $sqlFile" -ForegroundColor Red
    exit 1
}

# 读取 SQL 文件
$sqlContent = Get-Content $sqlFile -Raw

# 使用 psql 执行 SQL
try {
    # 设置环境变量以避免密码提示
    $env:PGPASSWORD = $dbPassword
    
    # 执行 SQL
    $result = $sqlContent | & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName
    
    Write-Host "✅ 迁移执行成功！" -ForegroundColor Green
    Write-Host $result
    
    # 清除密码环境变量
    Remove-Item env:PGPASSWORD
    
} catch {
    Write-Host "❌ 迁移执行失败: $_" -ForegroundColor Red
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✨ 完成！" -ForegroundColor Green
