import groovy.json.JsonOutput

pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
        git 'GitPath'
    }

    environment {
        BASE_URL           = 'https://www.saucedemo.com/'
        GITHUB_USER        = 'tejavardhangoud'
        GITHUB_REPO        = 'AutomationReport'
        MAX_BUILDS_TO_KEEP = '4'
        ONEDRIVE_FOLDER    = '/Users/kalaltejavardhangoud/Library/CloudStorage/OneDrive-CDW/uiAutomationReport'
        PLAYWRIGHT_SCRIPT  = 'test:sauce'
        SAUCE_REGION       = 'us-west-1'
        SAUCE_CREDENTIALS_ID = 'saucelabcred'
        TEAMS_WEBHOOK_URL  = credentials('teams-webhook-id')
        PATH               = "/opt/homebrew/bin:/usr/local/bin:/bin:/usr/bin:${env.PATH}"
    }

    options {
        buildDiscarder(logRotator(
            numToKeepStr:         '4',
            artifactNumToKeepStr: '4'
        ))
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${env.GIT_BRANCH} — commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        stage('Clean Old Allure Results') {
            steps {
                sh '''
                    rm -rf allure-results allure-report allure-report.zip
                    echo "Old Allure artifacts cleaned"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci --prefer-offline || npm install
                    echo "Node dependencies installed"
                '''
            }
        }

        stage('Install Playwright Browsers') {
            when {
                expression { env.PLAYWRIGHT_SCRIPT != 'test:sauce' }
            }
            steps {
                sh '''
                    npx playwright install chromium
                    echo "Playwright Chromium browser installed"
                '''
            }
        }

        stage('Run Playwright Tests') {
            steps {
                script {
                    if (env.PLAYWRIGHT_SCRIPT == 'test:sauce') {
                        withCredentials([usernamePassword(credentialsId: env.SAUCE_CREDENTIALS_ID, usernameVariable: 'SAUCE_USERNAME', passwordVariable: 'SAUCE_ACCESS_KEY')]) {
                            catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                                sh '''
                                    if [ -n "$SAUCE_USERNAME" ] && [ -n "$SAUCE_ACCESS_KEY" ]; then
                                        echo "Sauce credentials loaded from Jenkins"
                                    else
                                        echo "Sauce credentials missing"
                                        exit 1
                                    fi
                                    echo "Running npm script: ${PLAYWRIGHT_SCRIPT}"
                                    echo "BASE_URL=${BASE_URL}"
                                    echo "SAUCE_REGION=${SAUCE_REGION}"
                                    CI=true npm run ${PLAYWRIGHT_SCRIPT}
                                    echo "Sauce Labs execution completed"
                                '''
                            }
                        }
                    } else {
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            sh '''
                                echo "Running npm script: ${PLAYWRIGHT_SCRIPT}"
                                echo "BASE_URL=${BASE_URL}"
                                CI=true npm run ${PLAYWRIGHT_SCRIPT}
                                echo "Playwright tests completed"
                            '''
                        }
                    }
                }
            }
        }

        stage('Debug - Verify Allure Results') {
            steps {
                sh '''
                    echo "--- Listing allure-results folder ---"
                    ls -la allure-results/ || echo "ERROR: allure-results folder not found!"
                    echo "--- Total JSON files found ---"
                    find allure-results -name "*.json" | wc -l
                '''
            }
        }

        stage('Generate Allure HTML Report') {
            steps {
                sh '''
                    echo "Generating Allure HTML report..."
                    allure generate allure-results --clean -o allure-report
                    echo "Report generated."
                    ls -la allure-report/
                '''
            }
        }

        stage('Extract Test Statistics') {
            steps {
                script {
                    def statsJson = readFile("${WORKSPACE}/allure-report/widgets/summary.json")

                    env.TOTAL   = (statsJson =~ /"total"\s*:\s*(\d+)/)[0][1]
                    env.PASSED  = (statsJson =~ /"passed"\s*:\s*(\d+)/)[0][1]
                    env.FAILED  = (statsJson =~ /"failed"\s*:\s*(\d+)/)[0][1]
                    env.BROKEN  = (statsJson =~ /"broken"\s*:\s*(\d+)/)[0][1]
                    env.SKIPPED = (statsJson =~ /"skipped"\s*:\s*(\d+)/)[0][1]

                    def durationMatch = (statsJson =~ /"duration"\s*:\s*(\d+)/)
                    def durationMs    = durationMatch ? durationMatch[0][1] as long : 0L
                    env.TEST_DURATION = "${durationMs / 1000}s"

                    echo "✅ Passed: ${env.PASSED} | ❌ Failed: ${env.FAILED} | 💥 Broken: ${env.BROKEN} | ⏭️ Skipped: ${env.SKIPPED} | 📋 Total: ${env.TOTAL}"
                }
            }
        }

        stage('Zip Allure Report') {
            steps {
                sh '''
                    zip -r allure-report.zip allure-report/
                    echo "Zipped."
                    ls -lh allure-report.zip
                '''
            }
        }

        stage('Save Allure Report to OneDrive') {
            steps {
                script {
                    if (!env.ONEDRIVE_FOLDER?.trim()) {
                        error('ONEDRIVE_FOLDER is not configured. Set it in Jenkins environment variables before saving reports to OneDrive.')
                    }

                    def timestamp  = new Date().format('yyyyMMdd_HHmmss')
                    def buildLabel = "Build_${env.BUILD_NUMBER}_${timestamp}"
                    def baseFolder = env.ONEDRIVE_FOLDER.trim()
                    def destFolder = "${baseFolder}/${buildLabel}"
                    env.ONEDRIVE_BUILD_FOLDER = destFolder

                    sh """
                        mkdir -p "${baseFolder}"
                        mkdir -p "${destFolder}"
                        cp -r "${WORKSPACE}/allure-report/." "${destFolder}/"

                        report_folders=\$(find "${baseFolder}" -mindepth 1 -maxdepth 1 -type d -name 'Build_*' | sort -r)
                        old_folders=\$(printf '%s\n' "\$report_folders" | awk 'NR > 30')

                        if [ -n "\$old_folders" ]; then
                            printf '%s\n' "\$old_folders" | while IFS= read -r old_folder; do
                                [ -n "\$old_folder" ] || continue
                                rm -rf "\$old_folder"
                                echo "Removed old OneDrive report: \$old_folder"
                            done
                        fi

                        echo "Report saved to OneDrive: ${destFolder}"
                    """
                }
            }
        }

        stage('Publish Report to GitHub Pages') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'AutomationReport', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh '''
                        echo "Publishing Allure report to GitHub Pages..."
                        rm -rf /tmp/allure-gh-pages
                        cp -r ${WORKSPACE}/allure-report /tmp/allure-gh-pages
                        cd /tmp/allure-gh-pages
                        git init
                        git config user.email "jenkins@automation.com"
                        git config user.name "Jenkins CI"
                        git checkout -b gh-pages
                        git add .
                        git commit -m "Allure Report - Build ${BUILD_NUMBER} - $(date \'+%Y-%m-%d %H:%M\')"
                        git push -f https://${GH_USER}:${GH_TOKEN}@github.com/tejavardhangoud/AutomationReport.git gh-pages
                        echo "Report published!"
                        rm -rf /tmp/allure-gh-pages
                    '''
                }
                script {
                    env.REPORT_URL = "https://tejavardhangoud.github.io/AutomationReport/"
                }
            }
        }

        stage('Publish Allure Report in Jenkins') {
            steps {
                allure([
                    includeProperties: false,
                    jdk              : '',
                    results          : [[path: 'allure-results']]
                ])
            }
        }
    }

    post {
        always {
            echo "Build finished with status: ${currentBuild.result}"

            script {
                def passed         = env.PASSED         ?: '0'
                def failed         = env.FAILED         ?: '0'
                def broken         = env.BROKEN         ?: '0'
                def skipped        = env.SKIPPED        ?: '0'
                def total          = env.TOTAL          ?: '0'
                def testDur        = env.TEST_DURATION  ?: 'N/A'
                def reportUrl      = env.REPORT_URL     ?: 'https://tejavardhangoud.github.io/AutomationReport/'
                def jenkinsUrl     = env.BUILD_URL      ?: ''
                def githubPagesUrl = "https://${env.GITHUB_USER}.github.io/${env.GITHUB_REPO}"
                def buildDate      = new Date().format('dd MMM yyyy, hh:mm a')

                def gitBranch  = env.GIT_BRANCH  ?: 'N/A'
                def gitCommit  = env.GIT_COMMIT?.take(8) ?: 'N/A'

                def totalInt   = total.toInteger()
                def passedInt  = passed.toInteger()
                def failedInt  = failed.toInteger()
                def brokenInt  = broken.toInteger()
                def skippedInt = skipped.toInteger()

                def passRate   = totalInt > 0 ? (int)((passedInt  / totalInt) * 100) : 0
                def failRate   = totalInt > 0 ? (int)((failedInt  / totalInt) * 100) : 0
                def brokenRate = totalInt > 0 ? (int)((brokenInt  / totalInt) * 100) : 0
                def skipRate   = totalInt > 0 ? (int)((skippedInt / totalInt) * 100) : 0

                def isPartiallyPassed = (passedInt > 0 && (failedInt > 0 || brokenInt > 0))
                def displayResult     = isPartiallyPassed                      ? 'PARTIALLY PASSED'
                                      : (currentBuild.result == 'SUCCESS')     ? 'SUCCESS'
                                      : (currentBuild.result == 'FAILURE')     ? 'FAILURE'
                                      : (currentBuild.result ?: 'IN PROGRESS')

                def statusColor   = isPartiallyPassed                      ? '#f39c12'
                                  : (currentBuild.result == 'SUCCESS')     ? '#2ecc71'
                                  : (currentBuild.result == 'FAILURE')     ? '#e74c3c'
                                  : '#f39c12'
                def statusBgColor = isPartiallyPassed                      ? '#fef9e7'
                                  : (currentBuild.result == 'SUCCESS')     ? '#d5f5e3'
                                  : (currentBuild.result == 'FAILURE')     ? '#fadbd8'
                                  : '#fef9e7'
                def statusIcon    = isPartiallyPassed                      ? '⚠️'
                                  : (currentBuild.result == 'SUCCESS')     ? '✅'
                                  : (currentBuild.result == 'FAILURE')     ? '❌'
                                  : '⚠️'

                // ── DOUGHNUT CHART URL ─────────────────────────────────────────────────────
                def chartData = [
                    type: "doughnut",
                    data: [
                        labels: ["Passed", "Failed", "Broken", "Skipped"],
                        datasets: [[
                            data: [passedInt, failedInt, brokenInt, skippedInt],
                            backgroundColor: ["#2ecc71", "#e74c3c", "#f39c12", "#95a5a6"],
                            borderColor: "#ffffff",
                            borderWidth: 3,
                            hoverOffset: 6
                        ]]
                    ],
                    options: [
                        cutoutPercentage: 60,
                        plugins: [
                            legend: [
                                position: "bottom",
                                labels: [
                                    color: "#444444",
                                    font: [size: 12, weight: "600"],
                                    padding: 12,
                                    boxWidth: 12,
                                    usePointStyle: true,
                                    pointStyle: "circle"
                                ]
                            ],
                            title: [
                                display: true,
                                text: "Total: ${total}  |  Passed: ${passed}  Failed: ${failed}  Broken: ${broken}  Skipped: ${skipped}",
                                color: "#555555",
                                font: [size: 11, weight: "normal"],
                                padding: [top: 6, bottom: 0]
                            ]
                        ]
                    ]
                ]

                def chartJson = JsonOutput.toJson(chartData)
                def chartUrl  = "https://quickchart.io/chart?backgroundColor=white&width=360&height=240&c=" +
                                java.net.URLEncoder.encode(chartJson, 'UTF-8')

                echo "Chart URL (verify in browser): ${chartUrl}"

                // ── TEAMS ADAPTIVE CARD ────────────────────────────────────────────────────
                def teamsCard = [
                    type: "message",
                    attachments: [
                        [
                            contentType: "application/vnd.microsoft.card.adaptive",
                            contentUrl: null,
                            content: [
                                '$schema': "http://adaptivecards.io/schemas/adaptive-card.json",
                                type: "AdaptiveCard",
                                version: "1.4",
                                msteams: [width: "full"],
                                body: [
                                    // ── HEADER ────────────────────────────────────────────
                                    [
                                        type: "ColumnSet",
                                        style: (isPartiallyPassed ? "warning" : currentBuild.result == 'SUCCESS' ? "good" : currentBuild.result == 'FAILURE' ? "attention" : "warning"),
                                        bleed: true,
                                        columns: [
                                            [
                                                type: "Column",
                                                width: "stretch",
                                                items: [
                                                    [
                                                        type: "TextBlock",
                                                        text: "🤖  AUTOMATION PHASE 2 REPORT",
                                                        weight: "Bolder",
                                                        size: "Large",
                                                        color: "Default",
                                                        horizontalAlignment: "Center",
                                                        spacing: "Medium",
                                                        wrap: true
                                                    ],
                                                    [
                                                        type: "TextBlock",
                                                        text: "Build #${env.BUILD_NUMBER}  •  ${buildDate}",
                                                        size: "Small",
                                                        color: "Default",
                                                        isSubtle: true,
                                                        horizontalAlignment: "Center",
                                                        spacing: "None"
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ],
                                    // ── STATUS ────────────────────────────────────────────
                                    [
                                        type: "TextBlock",
                                        text: "${statusIcon}  ${displayResult}",
                                        weight: "Bolder",
                                        size: "ExtraLarge",
                                        color: (isPartiallyPassed ? "Warning" : currentBuild.result == 'SUCCESS' ? "Good" : currentBuild.result == 'FAILURE' ? "Attention" : "Warning"),
                                        horizontalAlignment: "Center",
                                        spacing: "Medium"
                                    ],
                                    [
                                        type: "TextBlock",
                                        text: "Pass Rate: ${passRate}%",
                                        weight: "Bolder",
                                        size: "Medium",
                                        color: (passRate >= 80 ? "Good" : passRate >= 50 ? "Warning" : "Attention"),
                                        horizontalAlignment: "Center",
                                        spacing: "None"
                                    ],
                                    // ── CHART SECTION ─────────────────────────────────────
                                    [
                                        type: "TextBlock",
                                        text: "📊  TEST RESULTS SUMMARY",
                                        weight: "Bolder",
                                        size: "Medium",
                                        color: "Default",
                                        spacing: "Medium",
                                        separator: true
                                    ],
                                    [
                                        type: "Container",
                                        style: "default",
                                        items: [
                                            [
                                                type: "Image",
                                                url: "${chartUrl}",
                                                altText: "Test Results: Passed ${passed} | Failed ${failed} | Broken ${broken} | Skipped ${skipped}",
                                                size: "Large",
                                                horizontalAlignment: "Center",
                                                spacing: "Small",
                                                style: "default"
                                            ]
                                        ]
                                    ],
                                    // ── STATS GRID ────────────────────────────────────────
                                    [
                                        type: "ColumnSet",
                                        spacing: "Small",
                                        columns: [
                                            [
                                                type: "Column",
                                                width: "stretch",
                                                items: [
                                                    [type: "TextBlock", text: "✅ Passed",  weight: "Bolder", color: "Good",      spacing: "Small"],
                                                    [type: "TextBlock", text: "❌ Failed",  weight: "Bolder", color: "Attention", spacing: "Small"]
                                                ]
                                            ],
                                            [
                                                type: "Column",
                                                width: "auto",
                                                items: [
                                                    [type: "TextBlock", text: "${passed} (${passRate}%)", weight: "Bolder", color: "Good",      horizontalAlignment: "Right", spacing: "Small"],
                                                    [type: "TextBlock", text: "${failed} (${failRate}%)", weight: "Bolder", color: "Attention", horizontalAlignment: "Right", spacing: "Small"]
                                                ]
                                            ],
                                            [
                                                type: "Column",
                                                width: "stretch",
                                                items: [
                                                    [type: "TextBlock", text: "💥 Broken",  weight: "Bolder", color: "Warning", spacing: "Small"],
                                                    [type: "TextBlock", text: "⏭️ Skipped", weight: "Bolder", color: "Default", spacing: "Small"]
                                                ]
                                            ],
                                            [
                                                type: "Column",
                                                width: "auto",
                                                items: [
                                                    [type: "TextBlock", text: "${broken} (${brokenRate}%)",  weight: "Bolder", color: "Warning", horizontalAlignment: "Right", spacing: "Small"],
                                                    [type: "TextBlock", text: "${skipped} (${skipRate}%)",   weight: "Bolder", color: "Default", horizontalAlignment: "Right", spacing: "Small"]
                                                ]
                                            ]
                                        ]
                                    ],
                                    [
                                        type: "TextBlock",
                                        text: "📋 Total: ${total} Tests  |  ⏱️ Duration: ${testDur}",
                                        weight: "Bolder",
                                        size: "Small",
                                        color: "Default",
                                        horizontalAlignment: "Center",
                                        spacing: "Small",
                                        separator: true
                                    ],
                                    // ── BUILD INFO ────────────────────────────────────────
                                    [
                                        type: "TextBlock",
                                        text: "🔧  BUILD INFORMATION",
                                        weight: "Bolder",
                                        size: "Medium",
                                        color: "Default",
                                        spacing: "Medium",
                                        separator: true
                                    ],
                                    [
                                        type: "FactSet",
                                        facts: [
                                            [title: "Build Number",  value: "#${env.BUILD_NUMBER}"],
                                            [title: "Status",        value: "${displayResult}"],
                                            [title: "Duration",      value: "${currentBuild.durationString}"],
                                            [title: "Test Duration", value: "${testDur}"],
                                            [title: "Branch",        value: "${gitBranch}"],
                                            [title: "Commit",        value: "${gitCommit}"],
                                            [title: "Environment",   value: "Playwright – Chromium"],
                                            [title: "Triggered By",  value: "${env.BUILD_CAUSE ?: 'Scheduled / Manual'}"],
                                            [title: "Date and Time", value: "${buildDate}"]
                                        ]
                                    ],
                                    // ── REPORT LINKS ──────────────────────────────────────
                                    [
                                        type: "TextBlock",
                                        text: "🔗  REPORT LINKS",
                                        weight: "Bolder",
                                        size: "Medium",
                                        color: "Default",
                                        spacing: "Medium",
                                        separator: true
                                    ],
                                    [
                                        type: "FactSet",
                                        facts: [
                                            [title: "Allure Report (GitHub Pages)", value: "${githubPagesUrl}"],
                                            [title: "Jenkins Build",                value: "${jenkinsUrl}"]
                                        ]
                                    ]
                                ],
                                actions: [
                                    [type: "Action.OpenUrl", title: "📊 View Allure Report", url: "${githubPagesUrl}", style: "positive"]
                                ]
                            ]
                        ]
                    ]
                ]

                def teamsJson = JsonOutput.toJson(teamsCard)
                writeFile file: '/tmp/teams_payload.json', text: teamsJson

                sh '''
                    echo "Sending Teams notification..."
                    curl -s -X POST "${TEAMS_WEBHOOK_URL}" \
                         -H "Content-Type: application/json" \
                         --data-binary @/tmp/teams_payload.json
                    echo ""
                    echo "Teams notification sent!"
                    rm -f /tmp/teams_payload.json
                '''

                // ── EMAIL ──────────────────────────────────────────────────────────────────
                def emailBody = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>AUTOMATION PHASE 2 REPORT</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; }
    body  { background-color: #f0f2f5 !important; }
    .card      { background-color: #ffffff !important; }
    .header-td { background-color: #16213e !important; }
    .footer-td { background-color: #f7f8fa !important; }
    .chart-td  { background-color: #ffffff !important; }
    [data-ogsc] body,
    [data-ogsb] body { background-color: #f0f2f5 !important; }
    [data-ogsc] .card,
    [data-ogsb] .card { background-color: #ffffff !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0f2f5" style="background-color:#f0f2f5;padding:32px 0;">
<tr><td align="center">
<table class="card" width="640" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <tr>
    <td class="header-td" bgcolor="#16213e" style="background-color:#16213e;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#aabbdd;">Regression Test Suite</p>
      <h1 style="margin:0;font-size:28px;font-weight:700;color:#61dafb;">AUTOMATION PHASE 2 REPORT</h1>
      <p style="margin:10px 0 0;font-size:14px;color:#aabbdd;">
        Build <span style="color:#61dafb;font-weight:700;">#${env.BUILD_NUMBER}</span>
        &nbsp;&bull;&nbsp;${gitBranch} @ ${gitCommit}
      </p>
    </td>
  </tr>

  <!-- STATUS BADGE -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 40px 8px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td bgcolor="${statusBgColor}" style="background-color:${statusBgColor};border-radius:50px;border:2px solid ${statusColor};padding:8px 28px;">
          <span style="color:${statusColor};font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
            ${statusIcon}&nbsp;&nbsp;${displayResult}
          </span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 40px 32px;">

      <!-- REPORT BUTTON -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td bgcolor="#1e8449" style="background-color:#1e8449;border-radius:10px;padding:20px;text-align:center;">
            <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#ffffff;">Full Interactive Allure Report &mdash; Opens in Browser</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
              <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:8px;">
                <a href="${reportUrl}" style="display:inline-block;padding:12px 32px;color:#1e8449;font-size:14px;font-weight:700;text-decoration:none;">Click Here to View Report</a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0;font-size:11px;color:#d5f5e3;">${reportUrl}</p>
          </td>
        </tr>
      </table>

      <!-- PASS RATE BAR -->
      <p style="margin:20px 0 6px;font-size:13px;font-weight:600;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">
        Pass Rate &nbsp;<span style="font-size:20px;color:#2ecc71;font-weight:700;">${passRate}%</span>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td bgcolor="#e8eaf0" style="background-color:#e8eaf0;border-radius:50px;height:10px;">
          <table cellpadding="0" cellspacing="0" width="${passRate}%"><tr>
            <td bgcolor="#2ecc71" style="background-color:#2ecc71;border-radius:50px;height:10px;font-size:0;">&nbsp;</td>
          </tr></table>
        </td>
      </tr></table>

      <!-- PIE CHART IMAGE -->
      <p style="margin:28px 0 10px;font-size:13px;font-weight:600;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">Test Results Chart</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="chart-td" align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:12px;border:1px solid #e8eaed;border-radius:8px;">
            <!--[if mso]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:360px;height:240px;">
              <v:fill type="solid" color="#ffffff"/>
              <v:textbox inset="0,0,0,0">
            <![endif]-->
            <img src="${chartUrl}"
                 alt="Test Results: Passed ${passed} (${passRate}%) | Failed ${failed} (${failRate}%) | Broken ${broken} (${brokenRate}%) | Skipped ${skipped} (${skipRate}%) | Total ${total}"
                 width="360"
                 height="240"
                 style="display:block;max-width:100%;border:0;outline:none;text-decoration:none;background-color:#ffffff;"
                 bgcolor="#ffffff" />
            <!--[if mso]>
              </v:textbox>
            </v:rect>
            <![endif]-->
          </td>
        </tr>
      </table>

      <!-- STATS TABLE -->
      <p style="margin:28px 0 10px;font-size:13px;font-weight:600;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">Test Results Summary</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e8eaed;">
        <thead>
          <tr>
            <td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:12px 16px;font-size:12px;font-weight:600;color:#888888;text-transform:uppercase;border-bottom:1px solid #e8eaed;">Status</td>
            <td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:12px 16px;text-align:center;font-size:12px;font-weight:600;color:#888888;text-transform:uppercase;border-bottom:1px solid #e8eaed;">Count</td>
            <td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:12px 16px;text-align:center;font-size:12px;font-weight:600;color:#888888;text-transform:uppercase;border-bottom:1px solid #e8eaed;">%</td>
            <td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:12px 16px;font-size:12px;font-weight:600;color:#888888;text-transform:uppercase;border-bottom:1px solid #e8eaed;">Bar</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;border-bottom:1px solid #f0f2f5;color:#333333;"><span style="display:inline-block;width:10px;height:10px;background:#2ecc71;border-radius:50%;margin-right:8px;"></span><b style="color:#333333;">Passed</b></td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;text-align:center;font-size:18px;font-weight:700;color:#2ecc71;border-bottom:1px solid #f0f2f5;">${passed}</td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#2ecc71;border-bottom:1px solid #f0f2f5;">${passRate}%</td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#eafaf1" style="background-color:#eafaf1;border-radius:4px;height:8px;"><table cellpadding="0" cellspacing="0" width="${passRate}%"><tr><td bgcolor="#2ecc71" style="background-color:#2ecc71;border-radius:4px;height:8px;font-size:0;">&nbsp;</td></tr></table></td></tr></table></td>
          </tr>
          <tr>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;border-bottom:1px solid #f0f2f5;color:#333333;"><span style="display:inline-block;width:10px;height:10px;background:#e74c3c;border-radius:50%;margin-right:8px;"></span><b style="color:#333333;">Failed</b></td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;text-align:center;font-size:18px;font-weight:700;color:#e74c3c;border-bottom:1px solid #f0f2f5;">${failed}</td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#e74c3c;border-bottom:1px solid #f0f2f5;">${failRate}%</td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fdedec" style="background-color:#fdedec;border-radius:4px;height:8px;"><table cellpadding="0" cellspacing="0" width="${failRate}%"><tr><td bgcolor="#e74c3c" style="background-color:#e74c3c;border-radius:4px;height:8px;font-size:0;">&nbsp;</td></tr></table></td></tr></table></td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;border-bottom:1px solid #f0f2f5;color:#333333;"><span style="display:inline-block;width:10px;height:10px;background:#e67e22;border-radius:50%;margin-right:8px;"></span><b style="color:#333333;">Broken</b></td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;text-align:center;font-size:18px;font-weight:700;color:#e67e22;border-bottom:1px solid #f0f2f5;">${broken}</td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#e67e22;border-bottom:1px solid #f0f2f5;">${brokenRate}%</td>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 16px;border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fef5e7" style="background-color:#fef5e7;border-radius:4px;height:8px;"><table cellpadding="0" cellspacing="0" width="${brokenRate}%"><tr><td bgcolor="#e67e22" style="background-color:#e67e22;border-radius:4px;height:8px;font-size:0;">&nbsp;</td></tr></table></td></tr></table></td>
          </tr>
          <tr>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;border-bottom:1px solid #f0f2f5;color:#333333;"><span style="display:inline-block;width:10px;height:10px;background:#95a5a6;border-radius:50%;margin-right:8px;"></span><b style="color:#333333;">Skipped</b></td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;text-align:center;font-size:18px;font-weight:700;color:#95a5a6;border-bottom:1px solid #f0f2f5;">${skipped}</td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#95a5a6;border-bottom:1px solid #f0f2f5;">${skipRate}%</td>
            <td bgcolor="#fafbfc" style="background-color:#fafbfc;padding:12px 16px;border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#f4f6f7" style="background-color:#f4f6f7;border-radius:4px;height:8px;"><table cellpadding="0" cellspacing="0" width="${skipRate}%"><tr><td bgcolor="#95a5a6" style="background-color:#95a5a6;border-radius:4px;height:8px;font-size:0;">&nbsp;</td></tr></table></td></tr></table></td>
          </tr>
          <tr>
            <td bgcolor="#16213e" style="background-color:#16213e;padding:13px 16px;"><b style="color:#ffffff;font-size:14px;">📋 Total</b></td>
            <td bgcolor="#16213e" style="background-color:#16213e;padding:13px 16px;text-align:center;font-size:20px;font-weight:800;color:#61dafb;">${total}</td>
            <td bgcolor="#16213e" style="background-color:#16213e;padding:13px 16px;text-align:center;color:#aabbdd;font-size:13px;">100%</td>
            <td bgcolor="#16213e" style="background-color:#16213e;padding:13px 16px;"><span style="color:#aabbdd;font-size:12px;">⏱️ ${testDur}</span></td>
          </tr>
        </tbody>
      </table>

      <!-- BUILD INFO TABLE -->
      <p style="margin:28px 0 10px;font-size:13px;font-weight:600;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">Build Information</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e8eaed;">
        <tr><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;width:40%;">Build Number</td><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">#${env.BUILD_NUMBER}</td></tr>
        <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Branch</td><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">${gitBranch}</td></tr>
        <tr><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Commit</td><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">${gitCommit}</td></tr>
        <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Duration</td><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">${currentBuild.durationString}</td></tr>
        <tr><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Test Duration</td><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">${testDur}</td></tr>
        <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Triggered By</td><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">${env.BUILD_CAUSE ?: 'Scheduled / Manual'}</td></tr>
        <tr><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;border-bottom:1px solid #e8eaed;">Environment</td><td bgcolor="#f7f8fa" style="background-color:#f7f8fa;padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #e8eaed;">Playwright – Chromium</td></tr>
        <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;font-weight:600;color:#666666;">Date and Time</td><td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:13px;color:#333333;">${buildDate}</td></tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td class="footer-td" bgcolor="#f7f8fa" style="background-color:#f7f8fa;border-top:1px solid #e8eaed;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#888888;">Generated by Jenkins CI &bull; AUTOMATION PHASE 2 &bull; Build #${env.BUILD_NUMBER}</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""

                emailext(
                    subject: "${statusIcon} AUTOMATION PHASE 2 REPORT: ${displayResult} | Build #${env.BUILD_NUMBER} | Passed: ${passed}/${total}",
                    mimeType: 'text/html',
                    to: '',
                    attachmentsPattern: 'allure-report.zip',
                    body: emailBody
                )
            }
        }

        success {
            echo '✅ All tests passed!'
        }

        failure {
            echo '❌ Build failed - check console output'
        }
    }
}