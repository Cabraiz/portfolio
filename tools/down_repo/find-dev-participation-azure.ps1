
param(
  [string]$Organization = "",
  [string]$Project = "",
  [string]$DestRoot = "$env:USERPROFILE\Documents\GitHub\AzureReposAudit",
  [string]$TargetsJsonPath = "",
  [ValidateSet("Contains","Exact")][string]$NameMatchMode = "Contains",
  [switch]$SkipPrComments,
  [switch]$ScanReviewersList,
  [switch]$ScanCommits,
  [int]$CommitsTop = 500,
  [int]$PrTop = 1000,
  [switch]$NoResume,
  [switch]$ResetState,
  [switch]$OpenCsv,
  [int]$ApiTimeoutSeconds = 120
)
$ErrorActionPreference="Stop"
function WI($m){Write-Host "[INFO] $m" -ForegroundColor Cyan}
function WO($m){Write-Host "[OK]   $m" -ForegroundColor Green}
function WW($m){Write-Host "[WARN] $m" -ForegroundColor Yellow}
function WE($m){Write-Host "[ERRO] $m" -ForegroundColor Red}
function GP($o,$n){ if($null -eq $o){return ""}; $p=$o.PSObject.Properties[$n]; if($null -eq $p -or $null -eq $p.Value){return ""}; return [string]$p.Value }
function HP($o,$n){ if($null -eq $o){return $false}; return $null -ne $o.PSObject.Properties[$n] }
function N($s){ if([string]::IsNullOrWhiteSpace($s)){return ""}; $x=([string]$s).Trim().ToLowerInvariant(); try{$d=$x.Normalize([Text.NormalizationForm]::FormD); $r=""; foreach($c in $d.ToCharArray()){ if([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark){$r+=$c}}; return $r.Normalize([Text.NormalizationForm]::FormC)}catch{return $x}}
function H($s){$sha=[Security.Cryptography.SHA256]::Create(); try{$b=[Text.Encoding]::UTF8.GetBytes([string]$s); return ([BitConverter]::ToString($sha.ComputeHash($b))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}}
function SH($s){return (H $s).Substring(0,12)}
function Esc($s){return [Uri]::EscapeDataString([string]$s)}
function AddQ($u,$n,$v){$sep='?'; if($u.Contains('?')){$sep='&'}; return "$u$sep$(Esc $n)=$(Esc $v)"}
function HeaderVal($headers,$name){ if($null -eq $headers){return ""}; foreach($k in $headers.Keys){ if(([string]$k).ToLowerInvariant() -eq $name.ToLowerInvariant()){ $v=$headers[$k]; if($null -eq $v){return ""}; if($v -is [array]){return [string]$v[0]}; return [string]$v }}; return "" }
function AdoGet($url,$headers,$timeout,$op){
  $out=New-Object System.Collections.ArrayList; $token=""
  do{
    $actual=$url; if(-not [string]::IsNullOrWhiteSpace($token)){$actual=AddQ $url "continuationToken" $token}
    try{
      $resp=Invoke-WebRequest -Uri $actual -Headers $headers -Method Get -TimeoutSec $timeout -UseBasicParsing
      $txt=[string]$resp.Content
      if(-not [string]::IsNullOrWhiteSpace($txt)){
        $j=$txt|ConvertFrom-Json
        if(HP $j "value"){ foreach($i in @($j.value)){[void]$out.Add($i)} } else { [void]$out.Add($j) }
      }
      $token=HeaderVal $resp.Headers "x-ms-continuationtoken"
    }catch{ throw "$op falhou: $($_.Exception.Message)" }
  }while(-not [string]::IsNullOrWhiteSpace($token))
  return @($out)
}
function NewTemplate($path){ @'
[
  { "email": "dev1@empresa.com" },
  { "email": "dev2@empresa.com" },
  { "email": "dev3@empresa.com" },
  { "name": "Nome Completo" },
  { "id": "00000000-0000-0000-0000-000000000000" },
  { "url": "https://vssps.dev.azure.com/ORG/_apis/Identities/00000000-0000-0000-0000-000000000000" }
]
'@ | Set-Content -Path $path -Encoding UTF8 }
function LoadTargets($path){
  $raw=Get-Content $path -Raw -Encoding UTF8; if([string]::IsNullOrWhiteSpace($raw)){throw "target-devs.json vazio"}
  $p=$raw|ConvertFrom-Json
  if((-not ($p -is [array])) -and (HP $p "targets")){$items=@($p.targets)} elseif((-not ($p -is [array])) -and (HP $p "devs")){$items=@($p.devs)} else {$items=@($p)}
  $list=New-Object System.Collections.ArrayList
  foreach($it in $items){
    if($null -eq $it){continue}
    $name="";$email="";$id="";$url=""
    if($it -is [string]){$name=[string]$it}else{$name=GP $it "name"; if([string]::IsNullOrWhiteSpace($name)){$name=GP $it "displayName"}; $email=GP $it "email"; if([string]::IsNullOrWhiteSpace($email)){$email=GP $it "uniqueName"}; $id=GP $it "id"; $url=GP $it "url"}
    $kind="";$term="";$key="";$extraId=""
    if(-not [string]::IsNullOrWhiteSpace($email)){$kind="email";$term=$email.Trim();$key= if([string]::IsNullOrWhiteSpace($name)){$term}else{$name.Trim()}}
    elseif(-not [string]::IsNullOrWhiteSpace($id)){$kind="id";$term=$id.Trim();$key= if([string]::IsNullOrWhiteSpace($name)){$term}else{$name.Trim()}}
    elseif(-not [string]::IsNullOrWhiteSpace($url)){$kind="url";$term=$url.Trim();$key= if([string]::IsNullOrWhiteSpace($name)){$term}else{$name.Trim()}; if($term -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"){$extraId=$Matches[1]}}
    elseif(-not [string]::IsNullOrWhiteSpace($name)){$kind="name";$term=$name.Trim();$key=$term}
    if([string]::IsNullOrWhiteSpace($term)){continue}
    [void]$list.Add([pscustomobject]@{Key=$key;Kind=$kind;Term=$term;Norm=N $term;ExtraId=$extraId})
  }
  return @($list)
}
function IdVals($id){$a=New-Object System.Collections.ArrayList; if($null -eq $id){return @()}; foreach($p in @('id','displayName','uniqueName','email','descriptor','url')){$v=GP $id $p; if(-not [string]::IsNullOrWhiteSpace($v)){[void]$a.Add($v)}}; return @($a|Select-Object -Unique)}
function IdKey($id){$v=GP $id 'id'; if($v){return 'id:'+(N $v)}; $v=GP $id 'email'; if(-not $v){$v=GP $id 'uniqueName'}; if($v){return 'email:'+(N $v)}; $v=GP $id 'url'; if($v){return 'url:'+(N $v)}; $v=GP $id 'displayName'; if($v){return 'name:'+(N $v)}; return ""}
function Matches($targets,$id,$mode){
  $vals=@(IdVals $id); $res=New-Object System.Collections.ArrayList; if($vals.Count -eq 0){return @()}
  foreach($t in $targets){ foreach($v in $vals){ $nv=N $v; $ok=$false; if($t.Kind -in @('email','id','url')){$ok=($nv -eq $t.Norm); if((-not $ok) -and $t.Kind -eq 'url' -and -not [string]::IsNullOrWhiteSpace($t.ExtraId)){$ok=($nv -eq (N $t.ExtraId))}} else { if($mode -eq 'Exact'){$ok=($nv -eq $t.Norm)}else{$ok=($nv.Contains($t.Norm) -or $t.Norm.Contains($nv))} }; if($ok){[void]$res.Add([pscustomobject]@{TargetKey=$t.Key;TargetKind=$t.Kind;MatchedTerm=$t.Term;MatchedValue=$v})} } }
  return @($res)
}
function Snap($id){return [pscustomobject]@{Id=GP $id 'id';DisplayName=GP $id 'displayName';UniqueName=GP $id 'uniqueName';Email=GP $id 'email';Descriptor=GP $id 'descriptor';Url=GP $id 'url'}}
function CommitId($p){return [pscustomobject]@{id="";displayName=GP $p 'name';uniqueName=GP $p 'email';email=GP $p 'email';descriptor="";url=""}}
function Prev($s,$max=180){ if([string]::IsNullOrWhiteSpace($s)){return ""}; $c=(([string]$s) -replace '<[^>]+>',' ' -replace '\s+',' ').Trim(); if($c.Length -le $max){return $c}; return $c.Substring(0,$max)+'...' }
function Row($key,$m,$id,$repoName,$repoId,$branch,$type,$date,$dateSource,$prId,$prTitle,$prStatus,$prCreated,$prClosed,$commentId,$commentPub,$commentUpd,$commentPreview,$commitId,$commitDate,$commitComment){$s=Snap $id; return [pscustomobject]@{EvidenceKey=$key;TargetKey=$m.TargetKey;TargetKind=$m.TargetKind;MatchedTerm=$m.MatchedTerm;MatchedValue=$m.MatchedValue;RepoName=$repoName;RepoId=$repoId;RepoDefaultBranch=$branch;ParticipationType=$type;ParticipationDate=$date;DateSource=$dateSource;PullRequestId=$prId;PullRequestTitle=$prTitle;PullRequestStatus=$prStatus;PullRequestCreationDate=$prCreated;PullRequestClosedDate=$prClosed;CommentId=$commentId;CommentPublishedDate=$commentPub;CommentLastUpdatedDate=$commentUpd;CommentPreview=$commentPreview;CommitId=$commitId;CommitDate=$commitDate;CommitComment=$commitComment;IdentityId=$s.Id;IdentityDisplayName=$s.DisplayName;IdentityUniqueName=$s.UniqueName;IdentityEmail=$s.Email;IdentityDescriptor=$s.Descriptor;IdentityUrl=$s.Url}}
function AppendCsv($path,$rows){ if(@($rows).Count -eq 0){return}; if(Test-Path $path){$rows|Export-Csv $path -NoTypeInformation -Encoding UTF8 -Append}else{$rows|Export-Csv $path -NoTypeInformation -Encoding UTF8} }
function FailCsv($path,$repo,$op,$msg){$r=[pscustomobject]@{Repo=$repo;Operation=$op;Message=(([string]$msg)-replace "`r|`n",' ')}; AppendCsv $path @($r)}
function SaveState($path,$state){$state.UpdatedAt=(Get-Date).ToString('s'); $state|ConvertTo-Json -Depth 10|Set-Content $path -Encoding UTF8}
function LoadState($path,$ctx){ if(!(Test-Path $path)){return [pscustomobject]@{ContextHash=$ctx;CreatedAt=(Get-Date).ToString('s');UpdatedAt=(Get-Date).ToString('s');LastCompletedRepoName="";TotalEvidence=0}}; try{$s=Get-Content $path -Raw -Encoding UTF8|ConvertFrom-Json; if((GP $s 'ContextHash') -ne $ctx){throw 'contexto mudou'}; if(!(HP $s 'LastCompletedRepoName')){$s|Add-Member LastCompletedRepoName "" -Force}; if(!(HP $s 'TotalEvidence')){$s|Add-Member TotalEvidence 0 -Force}; return $s}catch{return [pscustomobject]@{ContextHash=$ctx;CreatedAt=(Get-Date).ToString('s');UpdatedAt=(Get-Date).ToString('s');LastCompletedRepoName="";TotalEvidence=0}} }
function EmptyHistory($path){@([pscustomobject]@{EvidenceKey="";TargetKey="";TargetKind="";MatchedTerm="";MatchedValue="";RepoName="";RepoId="";RepoDefaultBranch="";ParticipationType="";ParticipationDate="";DateSource="";PullRequestId="";PullRequestTitle="";PullRequestStatus="";PullRequestCreationDate="";PullRequestClosedDate="";CommentId="";CommentPublishedDate="";CommentLastUpdatedDate="";CommentPreview="";CommitId="";CommitDate="";CommitComment="";IdentityId="";IdentityDisplayName="";IdentityUniqueName="";IdentityEmail="";IdentityDescriptor="";IdentityUrl=""})|Select-Object -First 0|Export-Csv $path -NoTypeInformation -Encoding UTF8}
function Summaries($raw,$hist,$byDevRepo,$byRepo,$byDev){
  if(!(Test-Path $raw)){EmptyHistory $hist; @()|Export-Csv $byDevRepo -NoTypeInformation -Encoding UTF8; @()|Export-Csv $byRepo -NoTypeInformation -Encoding UTF8; @()|Export-Csv $byDev -NoTypeInformation -Encoding UTF8; return 0}
  $rows=@(Import-Csv $raw -Encoding UTF8); $map=@{}; foreach($r in $rows){if($r.EvidenceKey -and !$map.ContainsKey($r.EvidenceKey)){$map[$r.EvidenceKey]=$r}}
  $u=@($map.Values|Sort-Object TargetKey,RepoName,ParticipationDate,ParticipationType); if($u.Count){$u|Export-Csv $hist -NoTypeInformation -Encoding UTF8}else{EmptyHistory $hist}
  $a=@(); foreach($g in @($u|Group-Object { $_.TargetKey+'||'+$_.RepoName })){ $gr=@($g.Group); $f=$gr[0]; $dates=@($gr|?{$_.ParticipationDate}|Sort-Object ParticipationDate); $types=@($gr|Select-Object -ExpandProperty ParticipationType -Unique|Sort-Object); $a += [pscustomobject]@{TargetKey=$f.TargetKey;RepoName=$f.RepoName;RepoId=$f.RepoId;EvidenceCount=$gr.Count;ParticipationTypes=($types -join '; ');FirstDate=if($dates.Count){$dates[0].ParticipationDate}else{''};LastDate=if($dates.Count){$dates[$dates.Count-1].ParticipationDate}else{''}} }
  $b=@(); foreach($g in @($u|Group-Object RepoName)){ $gr=@($g.Group); $f=$gr[0]; $dates=@($gr|?{$_.ParticipationDate}|Sort-Object ParticipationDate); $types=@($gr|Select-Object -ExpandProperty ParticipationType -Unique|Sort-Object); $devs=@($gr|Select-Object -ExpandProperty TargetKey -Unique|Sort-Object); $b += [pscustomobject]@{RepoName=$f.RepoName;RepoId=$f.RepoId;EvidenceCount=$gr.Count;DevsMatched=$devs.Count;Devs=($devs -join '; ');ParticipationTypes=($types -join '; ');FirstDate=if($dates.Count){$dates[0].ParticipationDate}else{''};LastDate=if($dates.Count){$dates[$dates.Count-1].ParticipationDate}else{''}} }
  $c=@(); foreach($g in @($u|Group-Object TargetKey)){ $gr=@($g.Group); $f=$gr[0]; $dates=@($gr|?{$_.ParticipationDate}|Sort-Object ParticipationDate); $types=@($gr|Select-Object -ExpandProperty ParticipationType -Unique|Sort-Object); $repos=@($gr|Select-Object -ExpandProperty RepoName -Unique|Sort-Object); $c += [pscustomobject]@{TargetKey=$f.TargetKey;EvidenceCount=$gr.Count;ReposMatched=$repos.Count;Repos=($repos -join '; ');ParticipationTypes=($types -join '; ');FirstDate=if($dates.Count){$dates[0].ParticipationDate}else{''};LastDate=if($dates.Count){$dates[$dates.Count-1].ParticipationDate}else{''}} }
  $a|Export-Csv $byDevRepo -NoTypeInformation -Encoding UTF8; $b|Export-Csv $byRepo -NoTypeInformation -Encoding UTF8; $c|Export-Csv $byDev -NoTypeInformation -Encoding UTF8; return $u.Count
}
function CheckDup($match,$id,$bucket,$dupCsv){ if($match.TargetKind -ne 'name'){return}; $k=IdKey $id; if(!$k){return}; if(!$bucket.ContainsKey($match.TargetKey)){$bucket[$match.TargetKey]=@{}}; $b=$bucket[$match.TargetKey]; if(!$b.ContainsKey($k)){$s=Snap $id; $b[$k]=[pscustomobject]@{TargetKey=$match.TargetKey;MatchedTerm=$match.MatchedTerm;IdentityKey=$k;IdentityId=$s.Id;DisplayName=$s.DisplayName;UniqueName=$s.UniqueName;Email=$s.Email;Url=$s.Url}}; if($b.Keys.Count -gt 1){$b.Values|Export-Csv $dupCsv -NoTypeInformation -Encoding UTF8; WE "Nome ambíguo: '$($match.TargetKey)' bateu em mais de uma identidade."; Write-Host "CSV de duplicatas: $dupCsv"; Write-Host "Troque por email, id ou url e rode com -ResetState."; exit 2} }

if([string]::IsNullOrWhiteSpace($Organization)){$Organization=Read-Host "Cole o nome da Organization do Azure DevOps"}
if([string]::IsNullOrWhiteSpace($Project)){$Project=Read-Host "Cole o nome do Project do Azure DevOps"}
if([string]::IsNullOrWhiteSpace($Organization) -or [string]::IsNullOrWhiteSpace($Project)){WE "Organization e Project são obrigatórios."; exit 1}
New-Item -ItemType Directory -Force -Path $DestRoot|Out-Null; $auditDir=Join-Path $DestRoot '_dev_participation_audit'; New-Item -ItemType Directory -Force -Path $auditDir|Out-Null
if([string]::IsNullOrWhiteSpace($TargetsJsonPath)){$TargetsJsonPath=Join-Path $DestRoot 'target-devs.json'}
if(!(Test-Path $TargetsJsonPath)){NewTemplate $TargetsJsonPath; WW "Arquivo criado: $TargetsJsonPath"; Start-Process notepad.exe $TargetsJsonPath; exit 0}
$rawTargets=Get-Content $TargetsJsonPath -Raw -Encoding UTF8; $targetsHash=SH $rawTargets; $targets=@(LoadTargets $TargetsJsonPath); if($targets.Count -eq 0){WE "Nenhum alvo válido no JSON."; exit 1}
$scanComments=-not [bool]$SkipPrComments; $ctx=H (($Organization.Trim().ToLowerInvariant(),$Project.Trim().ToLowerInvariant(),$targetsHash,$NameMatchMode,"comments=$scanComments","reviewers=$([bool]$ScanReviewersList)","commits=$([bool]$ScanCommits)") -join '|')
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; $stateFile=Join-Path $auditDir "scan-state-$targetsHash.json"; $rawCsv=Join-Path $auditDir "participation-raw-$targetsHash.csv"; $histCsv=Join-Path $auditDir "participation-history-$stamp.csv"; $byDevRepoCsv=Join-Path $auditDir "summary-by-dev-repo-$stamp.csv"; $byRepoCsv=Join-Path $auditDir "summary-by-repo-$stamp.csv"; $byDevCsv=Join-Path $auditDir "summary-by-dev-$stamp.csv"; $catalogCsv=Join-Path $auditDir "repos-catalog-$stamp.csv"; $accessCsv=Join-Path $auditDir "repos-accessible-$stamp.csv"; $disabledCsv=Join-Path $auditDir "repos-disabled-$stamp.csv"; $failCsv=Join-Path $auditDir "scan-failures-$stamp.csv"; $dupCsv=Join-Path $auditDir "target-duplicates-$stamp.csv"
if($ResetState){Remove-Item $stateFile -Force -ErrorAction SilentlyContinue; Remove-Item $rawCsv -Force -ErrorAction SilentlyContinue}
$state=if($NoResume){[pscustomobject]@{ContextHash=$ctx;CreatedAt=(Get-Date).ToString('s');UpdatedAt=(Get-Date).ToString('s');LastCompletedRepoName="";TotalEvidence=0}}else{LoadState $stateFile $ctx}; SaveState $stateFile $state
WI "Targets carregados:"; foreach($t in $targets){Write-Host " - $($t.Kind): $($t.Key)"}
$patSecure=Read-Host "Cole seu PAT do Azure DevOps" -AsSecureString; $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure); try{$pat=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}; if([string]::IsNullOrWhiteSpace($pat)){WE "PAT vazio."; exit 1}
$headers=@{Authorization='Basic '+[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))}; $baseApi="https://dev.azure.com/$Organization/$(Esc $Project)/_apis"
WI "Listando repositórios..."; $visible=@(AdoGet "$baseApi/git/repositories?api-version=7.1" $headers $ApiTimeoutSeconds 'LIST_REPOSITORIES' | Sort-Object name)
$catalog=@(); $access=@(); $disabled=@(); foreach($r in $visible){$dis=$false; try{$dis=[Convert]::ToBoolean((GP $r 'isDisabled'))}catch{$dis=$false}; $status=if($dis){'DISABLED'}else{'ACCESSIBLE'}; $row=[pscustomobject]@{Status=$status;Name=GP $r 'name';Id=GP $r 'id';IsDisabled=$dis;DefaultBranch=GP $r 'defaultBranch';Size=GP $r 'size'}; $catalog+=$row; if($dis){$disabled+=$r}else{$access+=$r}}
$catalog|Export-Csv $catalogCsv -NoTypeInformation -Encoding UTF8; @($catalog|?{$_.Status -eq 'ACCESSIBLE'})|Export-Csv $accessCsv -NoTypeInformation -Encoding UTF8; @($catalog|?{$_.Status -eq 'DISABLED'})|Export-Csv $disabledCsv -NoTypeInformation -Encoding UTF8
Write-Host "Visíveis pela API:       $($visible.Count)"; Write-Host "Acessíveis/ativos:       $($access.Count)"; Write-Host "Disabled/desabilitados:  $($disabled.Count)"
$repos=@($access); $last=GP $state 'LastCompletedRepoName'; if((-not $NoResume) -and $last){WW "Retomando depois de: $last"; $repos=@($access|?{[string]::Compare((GP $_ 'name'),$last,$true) -gt 0})}
if($repos.Count -eq 0){WO "Nada pendente. Gerando CSVs finais."; $total=Summaries $rawCsv $histCsv $byDevRepoCsv $byRepoCsv $byDevCsv; Write-Host "CSV principal: $histCsv"; if($OpenCsv){Start-Process notepad.exe $histCsv}; exit 0}
$dups=@{}; $totalRun=0; $fails=0; $i=0
foreach($repo in $repos){$i++; $repoId=GP $repo 'id'; $repoName=GP $repo 'name'; $branch=GP $repo 'defaultBranch'; Write-Host ""; WI "[$i/$($repos.Count)] $repoName"; $rows=New-Object System.Collections.ArrayList
  try{ $prs=@(AdoGet "$baseApi/git/repositories/$repoId/pullrequests?searchCriteria.status=all&%24top=$PrTop&api-version=7.1" $headers $ApiTimeoutSeconds 'LIST_PULL_REQUESTS')
    foreach($pr in $prs){$prId=GP $pr 'pullRequestId'; $prTitle=GP $pr 'title'; $prStatus=GP $pr 'status'; $prCreated=GP $pr 'creationDate'; $prClosed=GP $pr 'closedDate'
      foreach($m in @(Matches $targets $pr.createdBy $NameMatchMode)){CheckDup $m $pr.createdBy $dups $dupCsv; $key="$repoId|PR_CREATED|$prId|$($m.TargetKey)|$($m.MatchedTerm)"; [void]$rows.Add((Row $key $m $pr.createdBy $repoName $repoId $branch 'PR_CREATED' $prCreated 'pullRequest.creationDate' $prId $prTitle $prStatus $prCreated $prClosed '' '' '' '' '' '' ''))}
      if($ScanReviewersList -and (HP $pr 'reviewers')){foreach($rev in @($pr.reviewers)){foreach($m in @(Matches $targets $rev $NameMatchMode)){CheckDup $m $rev $dups $dupCsv; $rid=GP $rev 'id'; $key="$repoId|PR_REVIEWER_LISTED|$prId|$rid|$($m.TargetKey)|$($m.MatchedTerm)"; [void]$rows.Add((Row $key $m $rev $repoName $repoId $branch 'PR_REVIEWER_LISTED' '' 'no_exact_reviewer_date_in_pr_list' $prId $prTitle $prStatus $prCreated $prClosed '' '' '' '' '' '' ''))}}}
      if($scanComments){try{$threads=@(AdoGet "$baseApi/git/repositories/$repoId/pullRequests/$prId/threads?api-version=7.1" $headers $ApiTimeoutSeconds 'LIST_PR_THREADS'); foreach($th in $threads){if(!(HP $th 'comments')){continue}; foreach($c in @($th.comments)){if($null -eq $c.author){continue}; foreach($m in @(Matches $targets $c.author $NameMatchMode)){CheckDup $m $c.author $dups $dupCsv; $cid=GP $c 'id'; $pub=GP $c 'publishedDate'; $upd=GP $c 'lastUpdatedDate'; $prev=Prev (GP $c 'content'); $key="$repoId|PR_COMMENT|$prId|$cid|$($m.TargetKey)|$($m.MatchedTerm)"; [void]$rows.Add((Row $key $m $c.author $repoName $repoId $branch 'PR_COMMENT' $pub 'comment.publishedDate' $prId $prTitle $prStatus $prCreated $prClosed $cid $pub $upd $prev '' '' ''))}}}}catch{FailCsv $failCsv $repoName "LIST_PR_THREADS_$prId" $_.Exception.Message}}
    }
  }catch{$fails++; FailCsv $failCsv $repoName 'LIST_PULL_REQUESTS' $_.Exception.Message; WW "Falha ao varrer PRs deste repo."}
  if($ScanCommits){try{$commits=@(AdoGet "$baseApi/git/repositories/$repoId/commits?searchCriteria.%24top=$CommitsTop&api-version=7.1" $headers $ApiTimeoutSeconds 'LIST_COMMITS'); foreach($cm in $commits){$cid=GP $cm 'commitId'; $cprev=Prev (GP $cm 'comment') 220; foreach($role in @('author','committer')){$person=$cm.$role; if($null -eq $person){continue}; $ident=CommitId $person; foreach($m in @(Matches $targets $ident $NameMatchMode)){CheckDup $m $ident $dups $dupCsv; $date=GP $person 'date'; $ptype=if($role -eq 'author'){'COMMIT_AUTHOR'}else{'COMMIT_COMMITTER'}; $key="$repoId|$ptype|$cid|$($m.TargetKey)|$($m.MatchedTerm)"; [void]$rows.Add((Row $key $m $ident $repoName $repoId $branch $ptype $date "commit.$role.date" '' '' '' '' '' '' '' '' '' $cid $date $cprev))}}}}catch{$fails++; FailCsv $failCsv $repoName 'LIST_COMMITS' $_.Exception.Message; WW "Falha ao varrer commits deste repo."}}
  if($rows.Count -gt 0){AppendCsv $rawCsv @($rows); WO "Participações encontradas: $($rows.Count)"}else{WI "Nenhuma participação encontrada."}
  $totalRun += $rows.Count; $state.LastCompletedRepoName=$repoName; $state.TotalEvidence=[int](GP $state 'TotalEvidence')+$rows.Count; SaveState $stateFile $state
}
$totalUnique=Summaries $rawCsv $histCsv $byDevRepoCsv $byRepoCsv $byDevCsv
Write-Host ""; Write-Host "========================================"; Write-Host "Finalizado"; Write-Host "========================================"; Write-Host "Visíveis pela API:        $($visible.Count)"; Write-Host "Acessíveis/ativos:        $($access.Count)"; Write-Host "Disabled/desabilitados:   $($disabled.Count)"; Write-Host "Participações nesta execução: $totalRun"; Write-Host "Participações únicas totais:  $totalUnique"; Write-Host "Falhas:                       $fails"; Write-Host ""; Write-Host "CSV principal:"; Write-Host $histCsv; Write-Host ""; Write-Host "Resumo por dev + repo:"; Write-Host $byDevRepoCsv; Write-Host ""; Write-Host "Resumo por repo:"; Write-Host $byRepoCsv; Write-Host ""; Write-Host "Resumo por dev:"; Write-Host $byDevCsv; Write-Host ""; Write-Host "Duplicatas, se houver:"; Write-Host $dupCsv; if($OpenCsv){Start-Process notepad.exe $histCsv}
