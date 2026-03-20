param(
    [string]$SourceMarkdown = 'docs/dev-os-habr-draft.md',
    [string]$OutputRoot = 'output/dev-os-article'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Write-Utf8File {
    param([string]$Path,[string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Escape-Xml {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    $escaped = [System.Security.SecurityElement]::Escape($Text)
    if ($null -eq $escaped) { return '' }
    return $escaped
}

function Convert-InlineMarkdown {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    return [regex]::Replace($Text, '\[([^\]]+)\]\(([^)]+)\)', '$1 ($2)')
}

function New-Color {
    param([string]$Hex)
    $h = $Hex.TrimStart('#')
    return [System.Drawing.Color]::FromArgb(
        [Convert]::ToInt32($h.Substring(0,2),16),
        [Convert]::ToInt32($h.Substring(2,2),16),
        [Convert]::ToInt32($h.Substring(4,2),16)
    )
}

function New-StringFormat {
    param([string]$Alignment = 'Near', [string]$LineAlignment = 'Center')
    $fmt = New-Object System.Drawing.StringFormat
    switch ($Alignment) {
        'Center' { $fmt.Alignment = [System.Drawing.StringAlignment]::Center }
        'Far' { $fmt.Alignment = [System.Drawing.StringAlignment]::Far }
        default { $fmt.Alignment = [System.Drawing.StringAlignment]::Near }
    }
    switch ($LineAlignment) {
        'Near' { $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near }
        'Far' { $fmt.LineAlignment = [System.Drawing.StringAlignment]::Far }
        default { $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center }
    }
    return $fmt
}

function New-Canvas {
    param([int]$Width,[int]$Height,[string]$Title,[string]$Subtitle)
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear((New-Color '#F8FAFC'))
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (New-Color '#E2E8F0')), 0, 0, $Width, 92)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (New-Color '#0F172A')), 0, 0, 18, $Height)
    $titleFont = New-Object System.Drawing.Font 'Segoe UI Semibold', 28
    $subFont = New-Object System.Drawing.Font 'Segoe UI', 13
    $g.DrawString($Title, $titleFont, (New-Object System.Drawing.SolidBrush (New-Color '#0F172A')), [System.Drawing.RectangleF]::new(48,18,$Width-90,38))
    $g.DrawString($Subtitle, $subFont, (New-Object System.Drawing.SolidBrush (New-Color '#475569')), [System.Drawing.RectangleF]::new(50,56,$Width-100,24))
    return [pscustomobject]@{ Bitmap = $bmp; Graphics = $g }
}

function Draw-Box {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,[float]$Y,[float]$Width,[float]$Height,
        [string]$Text,[string]$FillHex,[string]$BorderHex,
        [string]$TextHex = '#0F172A',[float]$FontSize = 16,
        [string]$FontName = 'Segoe UI Semibold',[string]$Align = 'Center'
    )
    $rect = [System.Drawing.RectangleF]::new($X,$Y,$Width,$Height)
    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush (New-Color $FillHex)), $rect)
    $Graphics.DrawRectangle((New-Object System.Drawing.Pen (New-Color $BorderHex), 2), $X, $Y, $Width, $Height)
    $font = New-Object System.Drawing.Font $FontName, $FontSize
    $Graphics.DrawString($Text, $font, (New-Object System.Drawing.SolidBrush (New-Color $TextHex)), $rect, (New-StringFormat -Alignment $Align -LineAlignment 'Center'))
}

function Draw-Arrow {
    param([System.Drawing.Graphics]$Graphics,[float]$X1,[float]$Y1,[float]$X2,[float]$Y2,[string]$Hex = '#475569',[float]$Width = 3)
    $pen = New-Object System.Drawing.Pen (New-Color $Hex), $Width
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawLine($pen,$X1,$Y1,$X2,$Y2)
    $angle = [Math]::Atan2($Y2-$Y1,$X2-$X1)
    $size = 14
    $p1 = [System.Drawing.PointF]::new($X2,$Y2)
    $p2 = [System.Drawing.PointF]::new($X2-$size*[Math]::Cos($angle+[Math]::PI/7),$Y2-$size*[Math]::Sin($angle+[Math]::PI/7))
    $p3 = [System.Drawing.PointF]::new($X2-$size*[Math]::Cos($angle-[Math]::PI/7),$Y2-$size*[Math]::Sin($angle-[Math]::PI/7))
    $Graphics.FillPolygon((New-Object System.Drawing.SolidBrush (New-Color $Hex)), [System.Drawing.PointF[]]@($p1,$p2,$p3))
}

function Draw-Label {
    param([System.Drawing.Graphics]$Graphics,[string]$Text,[float]$X,[float]$Y,[float]$Width,[float]$Height,[string]$Hex = '#475569',[float]$FontSize = 14,[string]$Align = 'Center')
    $font = New-Object System.Drawing.Font 'Segoe UI', $FontSize
    $Graphics.DrawString($Text, $font, (New-Object System.Drawing.SolidBrush (New-Color $Hex)), [System.Drawing.RectangleF]::new($X,$Y,$Width,$Height), (New-StringFormat -Alignment $Align -LineAlignment 'Center'))
}

function Save-Canvas {
    param([pscustomobject]$Canvas,[string]$Path)
    $Canvas.Bitmap.Save($Path,[System.Drawing.Imaging.ImageFormat]::Png)
    $Canvas.Graphics.Dispose()
    $Canvas.Bitmap.Dispose()
}

function New-SystemGraphImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'Проект как живая модель системы' 'Узлы показывают сервисы, данные и проверки. Связи показывают реальные архитектурные зависимости.'
    $g = $canvas.Graphics
    Draw-Box $g 110 220 220 90 'Admin UI' '#DBEAFE' '#60A5FA'
    Draw-Box $g 420 160 250 100 'Public API' '#E0F2FE' '#38BDF8'
    Draw-Box $g 430 360 260 110 'Rental Service' '#FEF3C7' '#F59E0B'
    Draw-Box $g 820 220 250 100 'Auth Service' '#E2E8F0' '#94A3B8'
    Draw-Box $g 840 420 250 100 'Inventory Service' '#DCFCE7' '#22C55E'
    Draw-Box $g 1210 280 250 100 'PostgreSQL' '#FEE2E2' '#F87171'
    Draw-Box $g 1190 500 270 90 'Event Bus' '#EDE9FE' '#8B5CF6'
    Draw-Box $g 470 620 260 90 'Integration Tests' '#F1F5F9' '#94A3B8'
    Draw-Box $g 820 620 260 90 'Security Policies' '#FCE7F3' '#EC4899'
    Draw-Arrow $g 330 265 420 210 '#0EA5E9'
    Draw-Arrow $g 545 260 560 360 '#F59E0B'
    Draw-Arrow $g 670 210 820 250 '#64748B'
    Draw-Arrow $g 690 410 840 460 '#16A34A'
    Draw-Arrow $g 690 410 1210 330 '#DC2626'
    Draw-Arrow $g 1090 470 1190 545 '#7C3AED'
    Draw-Arrow $g 560 470 590 620 '#475569'
    Draw-Arrow $g 960 520 950 620 '#EC4899'
    Draw-Arrow $g 1070 470 1210 330 '#DC2626'
    Draw-Label $g 'source of truth' 700 90 220 32 '#0F172A' 18 'Center'
    Draw-Label $g 'Вместо просмотра десятков файлов инженер видит структуру зависимостей.' 170 760 1220 38 '#334155' 17 'Center'
    Save-Canvas $canvas $Path
}

function New-EvolutionImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'Эволюция разработки: рост уровня абстракции' 'Каждый крупный шаг убирал ручную работу ниже по стеку и поднимал основной артефакт выше.'
    $g = $canvas.Graphics
    $steps = @(
        @{ X = 120; Label = 'Machine code'; Color = '#CBD5E1' },
        @{ X = 340; Label = 'High-level languages'; Color = '#BFDBFE' },
        @{ X = 590; Label = 'Git & collaborative dev'; Color = '#C7D2FE' },
        @{ X = 860; Label = 'DevOps & IaC'; Color = '#FDE68A' },
        @{ X = 1090; Label = 'AI-assisted coding'; Color = '#A7F3D0' },
        @{ X = 1330; Label = 'System models'; Color = '#FDBA74' }
    )
    Draw-Arrow $g 140 420 1460 420 '#475569' 4
    foreach ($step in $steps) {
        $border = if ($step.Label -eq 'System models') { '#EA580C' } else { '#64748B' }
        Draw-Box $g $step.X 350 170 110 $step.Label $step.Color $border '#0F172A' 16
        Draw-Label $g '↓' ($step.X + 60) 470 50 40 '#94A3B8' 24 'Center'
    }
    Draw-Label $g 'Новый главный артефакт: не файл, а модель системы.' 250 620 1080 40 '#0F172A' 22 'Center'
    Draw-Label $g 'Именно в эту точку статья помещает Dev OS.' 300 680 980 34 '#475569' 16 'Center'
    Save-Canvas $canvas $Path
}

function New-CodeToCirImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'Как код превращается в рабочий контекст для AI' 'MVP не начинается с магии: сначала факты, потом граф, затем компактное представление под конкретную задачу.'
    $g = $canvas.Graphics
    Draw-Box $g 110 290 220 120 'Source code' '#E2E8F0' '#94A3B8'
    Draw-Box $g 410 290 220 120 'AST' '#DBEAFE' '#60A5FA'
    Draw-Box $g 710 290 250 120 'Dependency graph' '#DCFCE7' '#22C55E'
    Draw-Box $g 1050 290 250 120 'Semantic graph' '#FEF3C7' '#F59E0B'
    Draw-Box $g 1350 290 150 120 'CIR' '#FCE7F3' '#EC4899'
    Draw-Arrow $g 330 350 410 350 '#475569'
    Draw-Arrow $g 630 350 710 350 '#475569'
    Draw-Arrow $g 960 350 1050 350 '#475569'
    Draw-Arrow $g 1300 350 1350 350 '#475569'
    Draw-Label $g 'Файлы, модули, тесты' 110 430 220 32 '#475569' 15 'Center'
    Draw-Label $g 'Синтаксические узлы' 410 430 220 32 '#475569' 15 'Center'
    Draw-Label $g 'Кто кого вызывает' 710 430 250 32 '#475569' 15 'Center'
    Draw-Label $g 'Сервисы, API, данные, policy' 1050 430 250 32 '#475569' 15 'Center'
    Draw-Label $g 'Минимальный контекст' 1350 430 150 32 '#475569' 15 'Center'
    Draw-Label $g 'Чем правее, тем меньше шума и выше полезность для LLM.' 280 620 1020 36 '#0F172A' 20 'Center'
    Save-Canvas $canvas $Path
}

function New-ContextCompilerImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'Context Compiler' 'Компонент, который решает главный вопрос: какой минимальный контекст нужен, чтобы задача была выполнена корректно.'
    $g = $canvas.Graphics
    Draw-Box $g 80 320 200 110 'Task' '#DBEAFE' '#60A5FA'
    Draw-Box $g 340 250 220 110 'Semantic search' '#E0F2FE' '#38BDF8'
    Draw-Box $g 620 250 240 110 'Dependency expansion' '#DCFCE7' '#22C55E'
    Draw-Box $g 910 250 210 110 'Guards & policy' '#FEF3C7' '#F59E0B'
    Draw-Box $g 1160 250 180 110 'CIR' '#FCE7F3' '#EC4899'
    Draw-Box $g 1370 320 150 110 'Agent' '#E2E8F0' '#94A3B8'
    Draw-Arrow $g 280 375 340 305 '#475569'
    Draw-Arrow $g 560 305 620 305 '#475569'
    Draw-Arrow $g 860 305 910 305 '#475569'
    Draw-Arrow $g 1120 305 1160 305 '#475569'
    Draw-Arrow $g 1340 305 1370 375 '#475569'
    Draw-Label $g 'Найти релевантные узлы' 320 390 260 26 '#475569' 14 'Center'
    Draw-Label $g 'Добрать зависимости и контракты' 600 390 280 26 '#475569' 14 'Center'
    Draw-Label $g 'Ограничить права и инварианты' 880 390 270 26 '#475569' 14 'Center'
    Draw-Label $g 'Сжать без потери смысла' 1140 390 230 26 '#475569' 14 'Center'
    Draw-Label $g 'Шум вниз, точность вверх.' 450 630 700 36 '#0F172A' 22 'Center'
    Save-Canvas $canvas $Path
}

function New-AgentsImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'AI-агенты как инженерная команда' 'Разные роли получают разный контекст и сдают друг другу артефакты, а не просто сообщения в чате.'
    $g = $canvas.Graphics
    Draw-Box $g 120 220 200 90 'Planner' '#DBEAFE' '#60A5FA'
    Draw-Box $g 420 220 220 90 'Architect' '#E0F2FE' '#38BDF8'
    Draw-Box $g 740 220 250 90 'Implementation' '#FEF3C7' '#F59E0B'
    Draw-Box $g 1120 160 200 90 'QA' '#DCFCE7' '#22C55E'
    Draw-Box $g 1120 300 200 90 'Security' '#FCE7F3' '#EC4899'
    Draw-Box $g 1120 440 200 90 'DevOps' '#E2E8F0' '#94A3B8'
    Draw-Box $g 740 520 250 90 'Sandbox & checks' '#FDE68A' '#D97706'
    Draw-Box $g 420 520 220 90 'Graph update' '#DDD6FE' '#8B5CF6'
    Draw-Arrow $g 320 265 420 265 '#475569'
    Draw-Arrow $g 640 265 740 265 '#475569'
    Draw-Arrow $g 990 265 1120 205 '#475569'
    Draw-Arrow $g 990 265 1120 345 '#475569'
    Draw-Arrow $g 990 265 1120 485 '#475569'
    Draw-Arrow $g 1120 485 990 565 '#475569'
    Draw-Arrow $g 740 565 640 565 '#475569'
    Draw-Arrow $g 420 565 320 565 '#475569'
    Draw-Arrow $g 220 520 220 310 '#475569'
    Draw-Label $g 'План -> архитектурные рамки -> код -> проверки -> обновлённая модель' 260 710 1080 36 '#0F172A' 19 'Center'
    Save-Canvas $canvas $Path
}

function New-IdeConceptImage {
    param([string]$Path)
    $canvas = New-Canvas 1600 900 'IDE вокруг модели, а не вокруг файлов' 'Граф системы, задача, статус агентов и проверки собраны в одном рабочем интерфейсе.'
    $g = $canvas.Graphics
    Draw-Box $g 80 130 1440 700 '' '#FFFFFF' '#CBD5E1'
    Draw-Box $g 120 180 360 560 '' '#F8FAFC' '#CBD5E1'
    Draw-Box $g 520 180 540 250 '' '#F8FAFC' '#CBD5E1'
    Draw-Box $g 520 460 540 280 '' '#F8FAFC' '#CBD5E1'
    Draw-Box $g 1100 180 360 560 '' '#F8FAFC' '#CBD5E1'
    Draw-Label $g 'Graph navigator' 140 200 320 28 '#0F172A' 18 'Near'
    Draw-Label $g 'Task / intent' 540 200 500 28 '#0F172A' 18 'Near'
    Draw-Label $g 'Diff & checks' 540 480 500 28 '#0F172A' 18 'Near'
    Draw-Label $g 'Agents' 1120 200 320 28 '#0F172A' 18 'Near'
    Draw-Box $g 150 250 120 52 'API' '#DBEAFE' '#60A5FA'
    Draw-Box $g 330 250 120 52 'Service' '#FEF3C7' '#F59E0B'
    Draw-Box $g 240 360 120 52 'DB' '#FEE2E2' '#F87171'
    Draw-Box $g 150 470 120 52 'Tests' '#E2E8F0' '#94A3B8'
    Draw-Box $g 330 470 120 52 'Policy' '#FCE7F3' '#EC4899'
    Draw-Arrow $g 270 276 330 276 '#475569'
    Draw-Arrow $g 390 302 320 360 '#475569'
    Draw-Arrow $g 240 412 210 470 '#475569'
    Draw-Arrow $g 360 412 390 470 '#475569'
    Draw-Label $g 'Добавить временную блокировку пользователя и авто-разблокировку через 24 часа.' 555 245 470 64 '#0F172A' 18 'Near'
    Draw-Label $g 'Ограничения: не ломать публичный API, обновить integration tests, сохранить tenant isolation.' 555 320 470 80 '#475569' 15 'Near'
    Draw-Label $g '+ schema migration for user_locks' 555 525 470 28 '#0F172A' 16 'Near'
    Draw-Label $g '+ API patch /users/{id}' 555 565 470 28 '#0F172A' 16 'Near'
    Draw-Label $g '+ admin UI toggle' 555 605 470 28 '#0F172A' 16 'Near'
    Draw-Label $g '+ sandbox: tests passed, 1 security warning resolved' 555 645 470 48 '#475569' 15 'Near'
    Draw-Box $g 1135 250 290 58 'Planner: completed' '#DBEAFE' '#60A5FA'
    Draw-Box $g 1135 330 290 58 'Architect: boundary checked' '#E0F2FE' '#38BDF8'
    Draw-Box $g 1135 410 290 58 'Implementation: diff ready' '#FEF3C7' '#F59E0B'
    Draw-Box $g 1135 490 290 58 'QA: tests updated' '#DCFCE7' '#22C55E'
    Draw-Box $g 1135 570 290 58 'Security: no IDOR regression' '#FCE7F3' '#EC4899'
    Draw-Box $g 1135 650 290 58 'DevOps: sandbox green' '#E2E8F0' '#94A3B8'
    Save-Canvas $canvas $Path
}

function Parse-ArticleBlocks {
    param([string[]]$Lines)
    $blocks = New-Object System.Collections.Generic.List[object]
    $paragraphBuffer = New-Object System.Collections.Generic.List[string]
    $codeBuffer = New-Object System.Collections.Generic.List[string]
    $inCode = $false
    function Flush-Paragraph {
        if ($paragraphBuffer.Count -gt 0) {
            $text = (($paragraphBuffer.ToArray()) -join ' ').Trim()
            if ($text.Length -gt 0) { $blocks.Add([pscustomobject]@{ Type = 'paragraph'; Text = (Convert-InlineMarkdown $text) }) }
            $paragraphBuffer.Clear()
        }
    }
    foreach ($lineRaw in $Lines) {
        $line = [string]$lineRaw
        if ($line -eq '---') { break }
        if ($inCode) {
            if ($line.Trim() -eq '```') { $blocks.Add([pscustomobject]@{ Type = 'code'; Text = (($codeBuffer.ToArray()) -join "`n") }); $codeBuffer.Clear(); $inCode = $false } else { $codeBuffer.Add($line) }
            continue
        }
        if ($line.Trim() -eq '```') { Flush-Paragraph; $inCode = $true; continue }
        if ($line -match '^\[Иллюстрация\s+(\d+):') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'image'; Placeholder = [int]$matches[1] }); continue }
        if ($line -match '^#\s+(.+)$') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'title'; Text = (Convert-InlineMarkdown $matches[1].Trim()) }); continue }
        if ($line -match '^##\s+(.+)$') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'heading1'; Text = (Convert-InlineMarkdown $matches[1].Trim()) }); continue }
        if ($line -match '^###\s+(.+)$') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'heading2'; Text = (Convert-InlineMarkdown $matches[1].Trim()) }); continue }
        if ($line -match '^\s*-\s+(.+)$') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'bullet'; Text = (Convert-InlineMarkdown $matches[1].Trim()) }); continue }
        if ($line -match '^\s*(\d+\.)\s+(.+)$') { Flush-Paragraph; $blocks.Add([pscustomobject]@{ Type = 'number'; Text = "$($matches[1]) $((Convert-InlineMarkdown $matches[2].Trim()))" }); continue }
        if ($line.Trim().Length -eq 0) { Flush-Paragraph; continue }
        $paragraphBuffer.Add($line.Trim())
    }
    Flush-Paragraph
    return ,$blocks.ToArray()
}

function Insert-BlockAfterMatchingParagraph {
    param([object[]]$Blocks,[string]$StartsWith,[object]$BlockToInsert)
    $result = New-Object System.Collections.Generic.List[object]
    $inserted = $false
    foreach ($block in $Blocks) {
        $result.Add($block)
        if (-not $inserted -and $block.Type -eq 'paragraph' -and $block.Text.StartsWith($StartsWith)) { $result.Add($BlockToInsert); $inserted = $true }
    }
    return ,$result.ToArray()
}

function New-TextRunXml {
    param([string]$Text,[string]$FontName = '',[string]$FontSize = '',[switch]$Bold,[switch]$Italic,[string]$Color = '')
    $props = New-Object System.Text.StringBuilder
    if ($Bold) { [void]$props.Append('<w:b/>') }
    if ($Italic) { [void]$props.Append('<w:i/>') }
    if ($FontName -ne '') { [void]$props.Append('<w:rFonts w:ascii="').Append($FontName).Append('" w:hAnsi="').Append($FontName).Append('" w:cs="').Append($FontName).Append('"/>') }
    if ($FontSize -ne '') { [void]$props.Append('<w:sz w:val="').Append($FontSize).Append('"/><w:szCs w:val="').Append($FontSize).Append('"/>') }
    if ($Color -ne '') { [void]$props.Append('<w:color w:val="').Append($Color).Append('"/>') }
    return '<w:r><w:rPr>' + $props.ToString() + '</w:rPr><w:t xml:space="preserve">' + (Escape-Xml $Text) + '</w:t></w:r>'
}

function New-ParagraphXml {
    param([string]$Text,[string]$Style,[string]$Prefix = '')
    $pPr = '<w:pPr><w:pStyle w:val="' + $Style + '"/>'
    $content = ''
    if ($Prefix -ne '') { $pPr += '<w:ind w:left="720" w:hanging="360"/>'; $content += New-TextRunXml -Text $Prefix -Bold -Color '0F172A' }
    $pPr += '</w:pPr>'
    $content += New-TextRunXml -Text $Text -Color '111827'
    return '<w:p>' + $pPr + $content + '</w:p>'
}

function New-CodeParagraphXml {
    param([string]$Text)
    $lines = $Text -split "`n"
    $builder = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $lines.Length; $i++) {
        [void]$builder.Append('<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="19"/><w:szCs w:val="19"/><w:color w:val="1F2937"/></w:rPr><w:t xml:space="preserve">').Append((Escape-Xml $lines[$i])).Append('</w:t></w:r>')
        if ($i -lt $lines.Length - 1) { [void]$builder.Append('<w:r><w:br/></w:r>') }
    }
    return '<w:p><w:pPr><w:pStyle w:val="Code"/><w:spacing w:before="80" w:after="180"/><w:ind w:left="240" w:right="240"/><w:shd w:val="clear" w:color="auto" w:fill="F3F4F6"/></w:pPr>' + $builder.ToString() + '</w:p>'
}

function New-ImageParagraphXml {
    param([string]$RelId,[int]$DocPrId,[string]$Name,[long]$Cx,[long]$Cy)
    return @"
<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="180" w:after="60"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="$Cx" cy="$Cy"/>
        <wp:docPr id="$DocPrId" name="$Name"/>
        <wp:cNvGraphicFramePr/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="0" name="$Name"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="$RelId"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="$Cx" cy="$Cy"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
"@
}

function New-CaptionXml {
    param([string]$Text)
    return '<w:p><w:pPr><w:pStyle w:val="Caption"/></w:pPr>' + (New-TextRunXml -Text $Text -Italic -FontSize '18' -Color '64748B') + '</w:p>'
}

$rootDir = (Resolve-Path '.').Path
$sourcePath = Join-Path $rootDir $SourceMarkdown
if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Source markdown not found: $sourcePath" }
$articleRoot = Join-Path $rootDir $OutputRoot
$imagesDir = Join-Path $articleRoot 'illustrations'
$docDir = Join-Path $articleRoot 'doc'
$tempDir = Join-Path $articleRoot 'tmp-docx'
Ensure-Directory $articleRoot
Ensure-Directory $imagesDir
Ensure-Directory $docDir
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
Ensure-Directory $tempDir
Ensure-Directory (Join-Path $tempDir '_rels')
Ensure-Directory (Join-Path $tempDir 'docProps')
Ensure-Directory (Join-Path $tempDir 'word')
Ensure-Directory (Join-Path $tempDir 'word\_rels')
Ensure-Directory (Join-Path $tempDir 'word\media')

$imageDefs = [ordered]@{
    img1 = @{ File = 'dev-os-01-system-graph.png'; Caption = 'Иллюстрация 1. Проект как живой граф: сервисы, данные, тесты и политики в одном системном представлении.'; Builder = ${function:New-SystemGraphImage} }
    img2 = @{ File = 'dev-os-02-evolution.png'; Caption = 'Иллюстрация 2. Эволюция разработки: следующий уровень абстракции смещает основной артефакт от файлов к модели системы.'; Builder = ${function:New-EvolutionImage} }
    img3 = @{ File = 'dev-os-03-code-to-cir.png'; Caption = 'Иллюстрация 3. Поток преобразования: код, AST, граф зависимостей, семантический граф и CIR.'; Builder = ${function:New-CodeToCirImage} }
    img4 = @{ File = 'dev-os-04-context-compiler.png'; Caption = 'Иллюстрация 4. Context Compiler собирает минимальный, но достаточный контекст для агента.'; Builder = ${function:New-ContextCompilerImage} }
    img5 = @{ File = 'dev-os-05-agents.png'; Caption = 'Иллюстрация 5. Оркестрация AI-агентов: от планирования до sandbox-проверок и обновления графа.'; Builder = ${function:New-AgentsImage} }
    img6 = @{ File = 'dev-os-06-ide-concept.png'; Caption = 'Иллюстрация 6. Концепт IDE, построенной вокруг модели системы, задач и проверок, а не вокруг списка файлов.'; Builder = ${function:New-IdeConceptImage} }
}
foreach ($key in $imageDefs.Keys) { & $imageDefs[$key].Builder (Join-Path $imagesDir $imageDefs[$key].File) }

$blocks = Parse-ArticleBlocks -Lines (Get-Content -Path $sourcePath -Encoding UTF8)
for ($i = 0; $i -lt $blocks.Length; $i++) {
    if ($blocks[$i].Type -eq 'image') {
        switch ($blocks[$i].Placeholder) {
            1 { $blocks[$i] = [pscustomobject]@{ Type = 'image'; ImageKey = 'img1' } }
            2 { $blocks[$i] = [pscustomobject]@{ Type = 'image'; ImageKey = 'img3' } }
            3 { $blocks[$i] = [pscustomobject]@{ Type = 'image'; ImageKey = 'img4' } }
        }
    }
}
$blocks = Insert-BlockAfterMatchingParagraph -Blocks $blocks -StartsWith 'История разработки - это история роста абстракций.' -BlockToInsert ([pscustomobject]@{ Type = 'image'; ImageKey = 'img2' })
$blocks = Insert-BlockAfterMatchingParagraph -Blocks $blocks -StartsWith 'Оркестратор между ними должен передавать не "сырой чат"' -BlockToInsert ([pscustomobject]@{ Type = 'image'; ImageKey = 'img5' })
$blocks = Insert-BlockAfterMatchingParagraph -Blocks $blocks -StartsWith 'Если эта гипотеза верна, то через несколько лет лучшими средами разработки будут считаться' -BlockToInsert ([pscustomobject]@{ Type = 'image'; ImageKey = 'img6' })

Write-Utf8File (Join-Path $tempDir '[Content_Types].xml') @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

Write-Utf8File (Join-Path $tempDir '_rels\.rels') @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$now = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
Write-Utf8File (Join-Path $tempDir 'docProps\core.xml') @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Dev OS: статья для Habr</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$now</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$now</dcterms:modified>
</cp:coreProperties>
"@

Write-Utf8File (Join-Path $tempDir 'docProps\app.xml') @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>
"@

Write-Utf8File (Join-Path $tempDir 'word\styles.xml') @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="280"/></w:pPr><w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:pPr><w:spacing w:before="260" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="1E3A5F"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:pPr><w:spacing w:before="220" w:after="90"/></w:pPr><w:rPr><w:b/><w:color w:val="1E3A5F"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr><w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/></w:style>
</w:styles>
"@

$docRels = New-Object System.Text.StringBuilder
[void]$docRels.AppendLine('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
[void]$docRels.AppendLine('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')
[void]$docRels.AppendLine('  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')
$imageRelMap = @{}
$imageId = 2
foreach ($key in $imageDefs.Keys) {
    $relId = "rId$imageId"
    $imageRelMap[$key] = $relId
    Copy-Item -Path (Join-Path $imagesDir $imageDefs[$key].File) -Destination (Join-Path $tempDir (Join-Path 'word\media' $imageDefs[$key].File)) -Force
    [void]$docRels.AppendLine(('  <Relationship Id="' + $relId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + $imageDefs[$key].File + '"/>'))
    $imageId++
}
[void]$docRels.AppendLine('</Relationships>')
Write-Utf8File (Join-Path $tempDir 'word\_rels\document.xml.rels') $docRels.ToString()

$bodyBuilder = New-Object System.Text.StringBuilder
$docPrId = 1
foreach ($block in $blocks) {
    switch ($block.Type) {
        'title' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Title')) }
        'heading1' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Heading1')) }
        'heading2' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Heading2')) }
        'paragraph' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Normal')) }
        'bullet' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Normal' -Prefix '• ')) }
        'number' { [void]$bodyBuilder.AppendLine((New-ParagraphXml -Text $block.Text -Style 'Normal')) }
        'code' { [void]$bodyBuilder.AppendLine((New-CodeParagraphXml -Text $block.Text)) }
        'image' {
            $img = $imageDefs[$block.ImageKey]
            [void]$bodyBuilder.AppendLine((New-ImageParagraphXml -RelId $imageRelMap[$block.ImageKey] -DocPrId $docPrId -Name $img.File -Cx 5486400 -Cy 3086100))
            [void]$bodyBuilder.AppendLine((New-CaptionXml -Text $img.Caption))
            $docPrId++
        }
    }
}
$sectionXml = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1260" w:bottom="1440" w:left="1260" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
$($bodyBuilder.ToString())
    $sectionXml
  </w:body>
</w:document>
"@
Write-Utf8File (Join-Path $tempDir 'word\document.xml') $documentXml

$zipPath = Join-Path $articleRoot 'dev-os-habr-article.zip'
$docxPath = Join-Path $docDir 'dev-os-habr-article.docx'
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $docxPath) { Remove-Item -Force $docxPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
Move-Item -Path $zipPath -Destination $docxPath

[pscustomobject]@{
    Docx = (Resolve-Path $docxPath).Path
    Images = (Get-ChildItem -Path $imagesDir -Filter '*.png' | Sort-Object Name | Select-Object -ExpandProperty FullName)
} | ConvertTo-Json -Depth 4
