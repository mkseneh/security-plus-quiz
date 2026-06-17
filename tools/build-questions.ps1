$tsvPath = "questions.tsv"
$jsonPath = "questions.json"

if (!(Test-Path $tsvPath)) {
    Write-Error "questions.tsv not found"
    exit 1
}

$rows = @(Import-Csv -Path $tsvPath -Delimiter "`t")
$ids = @{}
$questions = @()

foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row.id) -or
        [string]::IsNullOrWhiteSpace($row.domain) -or
        [string]::IsNullOrWhiteSpace($row.question) -or
        [string]::IsNullOrWhiteSpace($row.A) -or
        [string]::IsNullOrWhiteSpace($row.B) -or
        [string]::IsNullOrWhiteSpace($row.C) -or
        [string]::IsNullOrWhiteSpace($row.D) -or
        [string]::IsNullOrWhiteSpace($row.answer) -or
        [string]::IsNullOrWhiteSpace($row.explanation)) {
        Write-Error "Missing required field in one row"
        exit 1
    }

    if ($row.answer -notin @("A", "B", "C", "D")) {
        Write-Error "Invalid answer for question ID $($row.id). Answer must be A, B, C, or D."
        exit 1
    }

    if ($ids.ContainsKey($row.id)) {
        Write-Error "Duplicate question ID found: $($row.id)"
        exit 1
    }

    $ids[$row.id] = $true

    $questions += [ordered]@{
        id = [int]$row.id
        domain = $row.domain
        question = $row.question
        options = [ordered]@{
            A = $row.A
            B = $row.B
            C = $row.C
            D = $row.D
        }
        answer = $row.answer
        explanation = $row.explanation
    }
}

$questions | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "Built questions.json successfully."
Write-Host "Total questions:" $questions.Count
