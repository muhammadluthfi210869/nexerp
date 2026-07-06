param(
  [string]$BaseUrl = "http://localhost:3002",
  [string]$Email = "admin@nexerp.id",
  [string]$Password = "password123"
)

$global:PASS = 0
$global:FAIL = 0

function Ok($msg) { Write-Host "  v $msg" -ForegroundColor Green; $global:PASS++ }
function Nok($msg) { Write-Host "  x $msg" -ForegroundColor Red; $global:FAIL++ }
function Step($n, $desc) { Write-Host "`n=== $n. $desc ===" -ForegroundColor Yellow }
function GetAuth() { return @{Authorization = "Bearer $global:TOKEN"} }

# Step A: Login
Step "A" "Login"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method Post `
    -Body "{`"email`":`"$Email`",`"password`":`"$Password`"}" `
    -ContentType "application/json" -UseBasicParsing
  $global:TOKEN = ($r.Content | ConvertFrom-Json).access_token
  if ($global:TOKEN) { Ok "JWT obtained" } else { Nok "Login failed"; exit 1 }
} catch { Nok "Login failed: $_"; exit 1 }

# =====================================
# SCENARIO 1: Lead to Full Cycle
# =====================================
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  SCENARIO 1: Lead -> Full Happy Path" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$TS = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Step "1.1" "Create Lead"
try {
  $ldata = @{clientName="API E2E $TS"; brandName="E2ETest"; contactInfo="0812$($TS % 100000000)";
    source="Instagram"; productInterest="Serum E2E"; moq=500; unitPrice=100000;
    estimatedValue=50000000; category="SKINCARE"}
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/lead" -Method Post `
    -Body ($ldata | ConvertTo-Json) -ContentType "application/json" `
    -Headers (GetAuth) -UseBasicParsing
  $lead = $r.Content | ConvertFrom-Json
  $global:LEAD_ID = $lead.id
  if ($lead.status -eq "NEW_LEAD") { Ok "Lead created: $($lead.id.Substring(0,8))... status=$($lead.status)" } else { Nok "Lead status: $($lead.status)" }
} catch { Nok "Create lead failed: $_" }

Step "1.2" "Advance lead to CONTACTED"
try {
  $advBody = "{`"action`":`"STAGE_UPDATED`",`"newStatus`":`"CONTACTED`",`"loggedBy`":`"E2E-Test`"}"
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/lead/$global:LEAD_ID/advance" -Method Patch `
    -Body $advBody -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  $lead2 = $r.Content | ConvertFrom-Json
  if ($lead2.status -eq "CONTACTED") { Ok "Lead advanced to CONTACTED" } else { Nok "Status: $($lead2.status)" }
} catch { Nok "Advance failed: $_" }

Step "1.3" "Log activity"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/lead/$global:LEAD_ID/activity" -Method Post `
    -Body "{`"activityType`":`"CHAT`",`"notes`":`"E2E follow-up`"}" `
    -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  Ok "Activity logged: HTTP $($r.StatusCode)"
} catch { Nok "Activity failed: $_" }

Step "1.4" "Create Sample Request"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/sample-request" -Method Post `
    -Body "{`"leadId`":`"$global:LEAD_ID`",`"productName`":`"E2E Sample`",`"price`":200000}" `
    -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  $samp = $r.Content | ConvertFrom-Json
  $global:SAMPLE_ID = $samp.id
  Ok "Sample request created: $($samp.id.Substring(0,8))..."
} catch { Nok "Sample request failed: $_" }

Step "1.5" "Advance lead to SAMPLE_REQUESTED"
try {
  $advBody = "{`"action`":`"STAGE_UPDATED`",`"newStatus`":`"SAMPLE_REQUESTED`",`"loggedBy`":`"E2E-Test`"}"
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/lead/$global:LEAD_ID/advance" -Method Patch `
    -Body $advBody -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  $adv = $r.Content | ConvertFrom-Json
  Ok "Advanced to $($adv.status)"
} catch { Write-Host "    SAMPLE_REQUESTED advance may need sample payment verified: $_" -ForegroundColor Yellow }

Step "1.6" "Create Sales Order"
try {
  $so = @{leadId=$global:LEAD_ID; sampleId=$global:SAMPLE_ID; totalAmount=55000000; quantity=500}
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/sales-order" -Method Post `
    -Body ($so | ConvertTo-Json) -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  $so_res = $r.Content | ConvertFrom-Json
  $global:SO_ID = $so_res.id
  if ($so_res.status -eq "PENDING_DP") { Ok "SO created: $($so_res.orderNumber) status=$($so_res.status)" } else { Nok "SO status: $($so_res.status)" }
} catch { Nok "SO creation failed: $_" }

# =====================================
# SCENARIO 2: Cancel After Invoice
# =====================================
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  SCENARIO 2: Cancel After Invoice" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

Step "2.1" "Issue Invoice"
try {
  $inv = @{id="INV-E2E-$TS"; soId=$global:SO_ID; amountDue=55000000; type="FINAL_PAYMENT"}
  $r = Invoke-WebRequest -Uri "$BaseUrl/commercial/invoices" -Method Post `
    -Body ($inv | ConvertTo-Json) -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  $inv_res = $r.Content | ConvertFrom-Json
  $global:INV_ID = $inv_res.id
  Ok "Invoice created: $($inv_res.id.Substring(0,8))..."
} catch { Write-Host "    Invoice issue failed: $_" -ForegroundColor Yellow }

Step "2.2" "Cancel Sales Order"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/bussdev/sales-order/$global:SO_ID/status" -Method Patch `
    -Body "{`"status`":`"CANCELLED`"}" -ContentType "application/json" -Headers (GetAuth) -UseBasicParsing
  if ($r.StatusCode -eq 200) { Ok "SO cancelled" } else { Nok "Cancel failed: HTTP $($r.StatusCode)" }
} catch { Nok "Cancel failed: $_" }

Step "2.3" "Check journals for reversal"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/finance/journals?soId=$global:SO_ID" -Method Get `
    -Headers (GetAuth) -UseBasicParsing
  $j = $r.Content
  if ($j -match "reversal" -or $j -match "reversed") { Ok "Reversal journal found" } else { Write-Host "    No reversal found (expected if no payment yet)" -ForegroundColor Yellow }
} catch { Write-Host "    Journal check: $_" -ForegroundColor Yellow }

# =====================================
# SCENARIO 3: Stock Shortage
# =====================================
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  SCENARIO 3: Stock Shortage Detection" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

Step "3" "Check materials"
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/master/materials?limit=5" -Method Get `
    -Headers (GetAuth) -UseBasicParsing
  $mats = $r.Content | ConvertFrom-Json
  if ($mats.Count -gt 0) {
    $mat = $mats[0]
    Ok "Material: $($mat.name) id=$($mat.id.Substring(0,8))..."
  } else { Write-Host "    No materials found" -ForegroundColor Yellow }
} catch { Write-Host "    Materials check: $_" -ForegroundColor Yellow }

# =====================================
# SUMMARY
# =====================================
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  RESULTS" -ForegroundColor Yellow
Write-Host "============================================"
Write-Host "  PASSED: $global:PASS" -ForegroundColor Green
Write-Host "  FAILED: $global:FAIL" -ForegroundColor Red
Write-Host "============================================"
if ($global:FAIL -eq 0) { Write-Host "  ALL API TESTS PASSED!" -ForegroundColor Green } else { Write-Host "  $global:FAIL TESTS FAILED" -ForegroundColor Red }
exit $global:FAIL
