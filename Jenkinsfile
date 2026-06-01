import groovy.json.JsonOutput

pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        GITHUB_USER        = 'tejavardhangoud'
        GITHUB_REPO        = 'AutomationReport'
        ONEDRIVE_FOLDER    = '/Users/kalaltejavardhangoud/Library/CloudStorage/OneDrive-CDW/AutomationReport'
        MAX_BUILDS_TO_KEEP = '4'
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
            steps {
                sh '''
                    npx playwright install chromium
                    echo "Playwright Chromium browser installed"
                '''
            }
        }

        stage('Run Playwright Tests') {
            steps {
                sh '''
                    npx playwright test --reporter=allure-playwright || true
                    echo "Playwright tests completed"
                '''
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
                    def timestamp  = new Date().format('yyyyMMdd_HHmmss')
                    def buildLabel = "Build_${env.BUILD_NUMBER}_${timestamp}"
                    def destFolder = "${env.ONEDRIVE_FOLDER}/${buildLabel}"
                    env.ONEDRIVE_BUILD_FOLDER = destFolder

                    sh """
                        mkdir -p "${destFolder}"
                        cp -r "${WORKSPACE}/allure-report/." "${destFolder}/"
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
                def oneDriveFolder = env.ONEDRIVE_BUILD_FOLDER ?: env.ONEDRIVE_FOLDER
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
                                    [
                                        type: "ColumnSet",
                                        style: (isPartiallyPassed ? "warning" : currentBuild.result == 'SUCCESS' ? "good" : currentBuild.result == 'FAILURE' ? "attention" : "warning"),
                                        bleed: true,
                                        columns: [
                                            [
                                                type: "Column",
                                                width: "stretch",
                                                items: [
                                                    [type: "TextBlock", text: "AUTOMATION PHASE 2 REPORT", weight: "Bolder", size: "Large", color: "Dark", horizontalAlignment: "Center", spacing: "Medium"],
                                                    [type: "TextBlock", text: "Build #${env.BUILD_NUMBER}  |  ${buildDate}", size: "Small", color: "Dark", horizontalAlignment: "Center", spacing: "None"]
                                                ]
                                            ]
                                        ]
                                    ],
                                    [
                                        type: "TextBlock",
                                        text: "${displayResult}",
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
                                    [
                                        type: "TextBlock",
                                        text: "TEST RESULTS SUMMARY",
                                        weight: "Bolder",
                                        size: "Medium",
                                        spacing: "Medium",
                                        separator: true
                                    ],
                                    [
                                        type: "ColumnSet",
                                        columns: [
                                            [
                                                type: "Column",
                                                width: "stretch",
                                                items: [
                                                    [type: "TextBlock", text: "✅ Passed",  weight: "Bolder", color: "Good",      spacing: "None"],
                                                    [type: "TextBlock", text: "❌ Failed",  weight: "Bolder", color: "Attention", spacing: "Small"],
                                                    [type: "TextBlock", text: "💥 Broken",  weight: "Bolder", color: "Warning",   spacing: "Small"],
                                                    [type: "TextBlock", text: "⏭️ Skipped", weight: "Bolder",                     spacing: "Small"],
                                                    [type: "TextBlock", text: "📋 Total",   weight: "Bolder",                     spacing: "Small"]
                                                ]
                                            ],
                                            [
                                                type: "Column",
                                                width: "auto",
                                                items: [
                                                    [type: "TextBlock", text: "${passed}",  weight: "Bolder", color: "Good",      horizontalAlignment: "Right", spacing: "None"],
                                                    [type: "TextBlock", text: "${failed}",  weight: "Bolder", color: "Attention", horizontalAlignment: "Right", spacing: "Small"],
                                                    [type: "TextBlock", text: "${broken}",  weight: "Bolder", color: "Warning",   horizontalAlignment: "Right", spacing: "Small"],
                                                    [type: "TextBlock", text: "${skipped}", weight: "Bolder",                     horizontalAlignment: "Right", spacing: "Small"],
                                                    [type: "TextBlock", text: "${total}",   weight: "Bolder",                     horizontalAlignment: "Right", spacing: "Small"]
                                                ]
                                            ]
                                        ]
                                    ],
                                    [
                                        type: "TextBlock",
                                        text: "BUILD INFORMATION",
                                        weight: "Bolder",
                                        size: "Medium",
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
                                    [
                                        type: "TextBlock",
                                        text: "REPORT LINKS",
                                        weight: "Bolder",
                                        size: "Medium",
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
                                    [type: "Action.OpenUrl", title: "View Allure Report", url: "${githubPagesUrl}", style: "positive"]
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

                def emailBody = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>AUTOMATION PHASE 2 REPORT</title></head>' +
                '<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:\'Segoe UI\', Arial, sans-serif;">' +
                '<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0f2f5" style="background-color:#f0f2f5; padding:32px 0;">' +
                '<tr><td align="center">' +
                '<table width="640" cellpadding="0" cellspacing="0" style="border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.10);">' +
                '<tr><td bgcolor="#16213e" style="background-color:#16213e; padding:32px 40px; text-align:center;">' +
                '<p style="margin:0 0 6px 0; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#aabbdd; font-family:\'Segoe UI\', Arial, sans-serif;">Regression Test Suite</p>' +
                '<h1 style="margin:0; font-size:30px; font-weight:700; color:#61dafb; font-family:\'Segoe UI\', Arial, sans-serif;">DASH REPORT</h1>' +
                '<p style="margin:10px 0 0; font-size:14px; color:#aabbdd; font-family:\'Segoe UI\', Arial, sans-serif;">Build &nbsp;<span style="color:#61dafb; font-weight:700;">#' + env.BUILD_NUMBER + '</span>&nbsp;&bull;&nbsp;<span style="color:#aabbdd;">' + gitBranch + ' @ ' + gitCommit + '</span></p>' +
                '</td></tr>' +
                '<tr><td bgcolor="#ffffff" style="background-color:#ffffff; padding:24px 40px 8px; text-align:center;">' +
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>' +
                '<td bgcolor="' + statusBgColor + '" style="background-color:' + statusBgColor + '; border-radius:50px; border:2px solid ' + statusColor + '; padding:8px 28px;">' +
                '<span style="color:' + statusColor + '; font-size:15px; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-family:\'Segoe UI\', Arial, sans-serif;">' + statusIcon + ' &nbsp; ' + displayResult + '</span>' +
                '</td></tr></table></td></tr>' +
                '<tr><td bgcolor="#ffffff" style="background-color:#ffffff; padding:16px 40px 32px;">' +
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 16px;"><tr>' +
                '<td bgcolor="#1e8449" style="background-color:#1e8449; border-radius:10px; padding:20px; text-align:center;">' +
                '<p style="margin:0 0 12px 0; font-size:14px; font-weight:700; color:#ffffff; font-family:\'Segoe UI\', Arial, sans-serif;">Full Interactive Allure Report &mdash; Opens in Browser</p>' +
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>' +
                '<td bgcolor="#ffffff" style="background-color:#ffffff; border-radius:8px; padding:0;">' +
                '<a href="' + reportUrl + '" style="display:inline-block; padding:12px 32px; color:#1e8449; font-size:14px; font-weight:700; text-decoration:none; font-family:\'Segoe UI\', Arial, sans-serif;">Click Here to View Report</a>' +
                '</td></tr></table>' +
                '<p style="margin:12px 0 0; font-size:11px; color:#d5f5e3; font-family:\'Segoe UI\', Arial, sans-serif;">' + reportUrl + '</p>' +
                '</td></tr></table>' +
                '<p style="margin:20px 0 6px; font-size:13px; font-weight:600; color:#555; letter-spacing:0.5px; text-transform:uppercase; font-family:\'Segoe UI\', Arial, sans-serif;">Pass Rate &nbsp;<span style="font-size:20px; color:#2ecc71; font-weight:700;">' + passRate + '%</span></p>' +
                '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
                '<td bgcolor="#e8eaf0" style="background-color:#e8eaf0; border-radius:50px; height:10px;">' +
                '<table cellpadding="0" cellspacing="0" width="' + passRate + '%"><tr>' +
                '<td bgcolor="#2ecc71" style="background-color:#2ecc71; border-radius:50px; height:10px; font-size:0;">&nbsp;</td>' +
                '</tr></table></td></tr></table>' +
                '<p style="margin:28px 0 10px; font-size:13px; font-weight:600; color:#555; letter-spacing:0.5px; text-transform:uppercase; font-family:\'Segoe UI\', Arial, sans-serif;">Test Results Summary</p>' +
                '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; border:1px solid #e8eaed;">' +
                '<thead><tr bgcolor="#f7f8fa" style="background-color:#f7f8fa;">' +
                '<th style="padding:12px 16px; text-align:left; font-size:12px; font-weight:600; color:#888; text-transform:uppercase; border-bottom:1px solid #e8eaed;">Status</th>' +
                '<th style="padding:12px 16px; text-align:center; font-size:12px; font-weight:600; color:#888; text-transform:uppercase; border-bottom:1px solid #e8eaed;">Count</th>' +
                '<th style="padding:12px 16px; text-align:center; font-size:12px; font-weight:600; color:#888; text-transform:uppercase; border-bottom:1px solid #e8eaed;">Bar</th>' +
                '</tr></thead><tbody>' +
                '<tr bgcolor="#ffffff"><td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><span style="display:inline-block; width:10px; height:10px; background:#2ecc71; border-radius:50%; margin-right:8px;"></span><b>Passed</b></td>' +
                '<td style="padding:12px 16px; text-align:center; font-size:18px; font-weight:700; color:#2ecc71; border-bottom:1px solid #f0f2f5;">' + passed + '</td>' +
                '<td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#eafaf1" style="background-color:#eafaf1; border-radius:4px; height:8px;"><table cellpadding="0" cellspacing="0" width="' + passRate + '%"><tr><td bgcolor="#2ecc71" style="background-color:#2ecc71; border-radius:4px; height:8px; font-size:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>' +
                '<tr bgcolor="#fafbfc"><td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><span style="display:inline-block; width:10px; height:10px; background:#e74c3c; border-radius:50%; margin-right:8px;"></span><b>Failed</b></td>' +
                '<td style="padding:12px 16px; text-align:center; font-size:18px; font-weight:700; color:#e74c3c; border-bottom:1px solid #f0f2f5;">' + failed + '</td>' +
                '<td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fdedec" style="background-color:#fdedec; border-radius:4px; height:8px;"><table cellpadding="0" cellspacing="0" width="' + failRate + '%"><tr><td bgcolor="#e74c3c" style="background-color:#e74c3c; border-radius:4px; height:8px; font-size:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>' +
                '<tr bgcolor="#ffffff"><td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><span style="display:inline-block; width:10px; height:10px; background:#e67e22; border-radius:50%; margin-right:8px;"></span><b>Broken</b></td>' +
                '<td style="padding:12px 16px; text-align:center; font-size:18px; font-weight:700; color:#e67e22; border-bottom:1px solid #f0f2f5;">' + broken + '</td>' +
                '<td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fef5e7" style="background-color:#fef5e7; border-radius:4px; height:8px;"><table cellpadding="0" cellspacing="0" width="' + brokenRate + '%"><tr><td bgcolor="#e67e22" style="background-color:#e67e22; border-radius:4px; height:8px; font-size:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>' +
                '<tr bgcolor="#fafbfc"><td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><span style="display:inline-block; width:10px; height:10px; background:#95a5a6; border-radius:50%; margin-right:8px;"></span><b>Skipped</b></td>' +
                '<td style="padding:12px 16px; text-align:center; font-size:18px; font-weight:700; color:#95a5a6; border-bottom:1px solid #f0f2f5;">' + skipped + '</td>' +
                '<td style="padding:12px 16px; border-bottom:1px solid #f0f2f5;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#f4f6f7" style="background-color:#f4f6f7; border-radius:4px; height:8px;"><table cellpadding="0" cellspacing="0" width="' + skipRate + '%"><tr><td bgcolor="#95a5a6" style="background-color:#95a5a6; border-radius:4px; height:8px; font-size:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>' +
                '<tr bgcolor="#16213e"><td style="padding:13px 16px;"><b style="color:#ffffff; font-size:14px;">Total</b></td>' +
                '<td style="padding:13px 16px; text-align:center; font-size:20px; font-weight:800; color:#61dafb;">' + total + '</td>' +
                '<td style="padding:13px 16px;"><span style="color:#aabbdd; font-size:12px;">Duration: ' + testDur + '</span></td></tr>' +
                '</tbody></table>' +
                '<p style="margin:28px 0 10px; font-size:13px; font-weight:600; color:#555; letter-spacing:0.5px; text-transform:uppercase;">Build Information</p>' +
                '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; border:1px solid #e8eaed;">' +
                '<tr bgcolor="#f7f8fa"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed; width:40%;">Build Number</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">#' + env.BUILD_NUMBER + '</td></tr>' +
                '<tr bgcolor="#ffffff"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed;">Branch</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">' + gitBranch + '</td></tr>' +
                '<tr bgcolor="#f7f8fa"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed;">Commit</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">' + gitCommit + '</td></tr>' +
                '<tr bgcolor="#ffffff"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed;">Duration</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">' + currentBuild.durationString + '</td></tr>' +
                '<tr bgcolor="#f7f8fa"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed;">Triggered By</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">' + (env.BUILD_CAUSE ?: 'Scheduled / Manual') + '</td></tr>' +
                '<tr bgcolor="#ffffff"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666; border-bottom:1px solid #e8eaed;">Environment</td><td style="padding:10px 16px; font-size:13px; color:#333; border-bottom:1px solid #e8eaed;">Playwright – Chromium</td></tr>' +
                '<tr bgcolor="#f7f8fa"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#666;">OneDrive Backup</td><td style="padding:10px 16px; font-size:11px; color:#1a4a8a; word-break:break-all;">' + oneDriveFolder + '</td></tr>' +
                '</table></td></tr>' +
                '<tr><td bgcolor="#f7f8fa" style="background-color:#f7f8fa; border-top:1px solid #e8eaed; padding:16px 40px; text-align:center;">' +
                '<p style="margin:0; font-size:12px; color:#aaa;">Generated by Jenkins CI &bull; AUTOMATION PHASE 2 &bull; Build #' + env.BUILD_NUMBER + '</p>' +
                '</td></tr></table></td></tr></table></body></html>'

                emailext(
                    subject: "${statusIcon} AUTOMATION PHASE Test REPORT: ${displayResult} | Build #${env.BUILD_NUMBER} | Passed: ${passed}/${total}",
                    mimeType: 'text/html',
                    to: 'tejavardhangoud.kalal@cdw.com,karthikeyan.jegadeesan@cdw.com,kishorkumar.dhanabose@cdw.com',
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