# 修复所有实体文件中的重复索引问题
$entities = @(
    "src\modules\collections\entities\collection-item.entity.ts",
    "src\modules\collections\entities\game-collection.entity.ts",
    "src\modules\invitations\entities\invitation.entity.ts",
    "src\modules\offline\entities\offline-game.entity.ts",
    "src\modules\points\entities\point-transaction.entity.ts",
    "src\modules\recommendations\entities\recommendation.entity.ts",
    "src\modules\social\entities\friend-relationship.entity.ts"
)

foreach ($file in $entities) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        
        # 读取文件内容
        $content = Get-Content $file -Raw
        
        # 删除列级别的 @Index() 装饰器（保留类级别的索引）
        # 匹配模式：@Column 后面紧跟着的 @Index()
        $content = $content -replace '(@Column[^\r\n]+)\r?\n\s+@Index\(\)', '$1'
        
        # 写回文件
        $content | Set-Content $file -NoNewline
        
        Write-Host "  Fixed: $file"
    }
}

Write-Host "All entity files processed successfully!"

