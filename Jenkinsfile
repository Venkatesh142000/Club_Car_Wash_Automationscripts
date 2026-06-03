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
        PLAYWRIGHT_SCRIPT  = 'test:jenkins'
        SAUCE_REGION       = 'eu-central-1'
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

                def hasBrokenOnly = brokenInt > 0 && failedInt == 0
                def isPartiallyPassed = (passedInt > 0 && (failedInt > 0 || brokenInt > 0))
                def displayResult     = hasBrokenOnly                         ? 'BROKEN'
                                      : isPartiallyPassed                      ? 'PARTIALLY PASSED'
                                      : (currentBuild.result == 'SUCCESS')     ? 'SUCCESS'
                                      : (currentBuild.result == 'FAILURE')     ? 'FAILURE'
                                      : (currentBuild.result ?: 'IN PROGRESS')

                def statusColor   = hasBrokenOnly                         ? '#f39c12'
                                  : isPartiallyPassed                      ? '#f39c12'
                                  : (currentBuild.result == 'SUCCESS')     ? '#2ecc71'
                                  : (currentBuild.result == 'FAILURE')     ? '#e74c3c'
                                  : '#f39c12'
                def statusBgColor = hasBrokenOnly                         ? '#fef9e7'
                                  : isPartiallyPassed                      ? '#fef9e7'
                                  : (currentBuild.result == 'SUCCESS')     ? '#d5f5e3'
                                  : (currentBuild.result == 'FAILURE')     ? '#fadbd8'
                                  : '#fef9e7'
                def statusIcon    = hasBrokenOnly                         ? '💥'
                                  : isPartiallyPassed                      ? '⚠️'
                                  : (currentBuild.result == 'SUCCESS')     ? '✅'
                                  : (currentBuild.result == 'FAILURE')     ? '❌'
                                  : '⚠️'
                def teamsStatusStyle = hasBrokenOnly                         ? 'warning'
                                      : isPartiallyPassed                      ? 'warning'
                                      : (currentBuild.result == 'SUCCESS')     ? 'good'
                                      : (currentBuild.result == 'FAILURE')     ? 'attention'
                                      : 'warning'
                def bannerBgColor = hasBrokenOnly                         ? '#d4a017'
                                   : isPartiallyPassed                      ? '#d4a017'
                                   : (currentBuild.result == 'SUCCESS')     ? '#1f9d55'
                                   : (currentBuild.result == 'FAILURE')     ? '#c0392b'
                                   : '#d4a017'
                def bannerTextColor = '#ffffff'
                def bannerSubtleTextColor = isPartiallyPassed ? '#fff6db' : '#f6f9fc'

                // ── DOUGHNUT CHART URL ─────────────────────────────────────────────────────
                def hasResults = totalInt > 0
                def chartCenterPrimary = hasResults ? "${passRate}%" : "NO"
                def chartCenterSecondary = hasResults ? "PASS" : "RESULTS"
                def chartCenterColor = passRate >= 80 ? "#2e7d32" : passRate >= 50 ? "#d68910" : "#c0392b"
                def chartLegendDisplay = totalInt > 0 && (failedInt > 0 || brokenInt > 0 || skippedInt > 0)

                def chartData = hasResults
                    ? [
                        type: "doughnut",
                        data: [
                            labels: ["Passed", "Failed", "Broken", "Skipped"],
                            datasets: [[
                                data: [passedInt, failedInt, brokenInt, skippedInt],
                                backgroundColor: ["#2ecc71", "#e74c3c", "#f39c12", "#95a5a6"],
                                borderColor: "#ffffff",
                                borderWidth: 3,
                                hoverOffset: 4
                            ]]
                        ],
                        options: [
                            cutoutPercentage: 78,
                            layout: [
                                padding: [top: 2, right: 2, bottom: 2, left: 2]
                            ],
                            plugins: [
                                datalabels: [display: false],
                                doughnutlabel: [
                                    labels: [
                                        [
                                            text: chartCenterPrimary,
                                            color: chartCenterColor,
                                            font: [size: 44, weight: "bold"]
                                        ],
                                        [
                                            text: chartCenterSecondary,
                                            color: "#2f3640",
                                            font: [size: 18, weight: "bold"]
                                        ]
                                    ]
                                ],
                                legend: [
                                    display: chartLegendDisplay,
                                    position: "bottom",
                                    labels: [
                                        color: "#444444",
                                    font: [size: 12, weight: "600"],
                                    padding: 10,
                                    boxWidth: 12,
                                        usePointStyle: true,
                                        pointStyle: "circle"
                                    ]
                                ]
                            ]
                        ]
                    ]
                    : [
                        type: "doughnut",
                        data: [
                            labels: ["No results generated"],
                            datasets: [[
                                data: [1],
                                backgroundColor: ["#d5dbdb"],
                                borderColor: "#ffffff",
                                borderWidth: 3
                            ]]
                        ],
                        options: [
                            cutoutPercentage: 78,
                            layout: [
                                padding: [top: 2, right: 2, bottom: 2, left: 2]
                            ],
                            plugins: [
                                datalabels: [display: false],
                                doughnutlabel: [
                                    labels: [
                                        [
                                            text: chartCenterPrimary,
                                            color: "#7f8c8d",
                                            font: [size: 38, weight: "bold"]
                                        ],
                                        [
                                            text: chartCenterSecondary,
                                            color: "#636e72",
                                            font: [size: 17, weight: "bold"]
                                        ]
                                    ]
                                ],
                                legend: [
                                    display: false,
                                    position: "bottom",
                                    labels: [
                                        color: "#666666",
                                        font: [size: 13, weight: "600"],
                                        padding: 14,
                                        boxWidth: 14,
                                        usePointStyle: true,
                                        pointStyle: "circle"
                                    ]
                                ]
                            ]
                        ]
                    ]

                def chartJson = JsonOutput.toJson(chartData)
                    def chartUrl  = "https://quickchart.io/chart?backgroundColor=white&width=486&height=356&devicePixelRatio=2&c=" +
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
                                        type: "Container",
                                        style: "default",
                                        bleed: true,
                                        backgroundImage: [
                                            url: "https://dummyimage.com/1200x2/16213e/16213e.png",
                                            fillMode: "RepeatHorizontally"
                                        ],
                                        items: [
                                            [
                                                type: "ColumnSet",
                                                columns: [
                                                    [
                                                        type: "Column",
                                                        width: "stretch",
                                                        items: [
                                                            [
                                                                type: "TextBlock",
                                                                text: "REGRESSION TEST SUITE",
                                                                size: "Small",
                                                                color: "Light",
                                                                isSubtle: true,
                                                                horizontalAlignment: "Center",
                                                                spacing: "None",
                                                                wrap: true
                                                            ],
                                                            [
                                                                type: "TextBlock",
                                                                text: "🤖  AUTOMATION PHASE 2 REPORT",
                                                                weight: "Bolder",
                                                                size: "Large",
                                                                color: "Light",
                                                                horizontalAlignment: "Center",
                                                                spacing: "Small",
                                                                wrap: true
                                                            ],
                                                            [
                                                                type: "TextBlock",
                                                                text: "Build #${env.BUILD_NUMBER}  •  ${gitBranch} @ ${gitCommit}  •  ${buildDate}",
                                                                size: "Small",
                                                                color: "Light",
                                                                isSubtle: true,
                                                                horizontalAlignment: "Center",
                                                                spacing: "None",
                                                                wrap: true
                                                            ]
                                                        ]
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
                                    // ── REPORT CTA ───────────────────────────────────────
                                    [
                                        type: "Container",
                                        style: "default",
                                        bleed: true,
                                        spacing: "Medium",
                                        backgroundImage: [
                                            url: "https://dummyimage.com/1200x2/1e8449/1e8449.png",
                                            fillMode: "RepeatHorizontally"
                                        ],
                                        items: [
                                            [
                                                type: "TextBlock",
                                                text: "Full Interactive Allure Report — Opens in Browser",
                                                weight: "Bolder",
                                                size: "Small",
                                                color: "Light",
                                                horizontalAlignment: "Center",
                                                wrap: true
                                            ],
                                            [
                                                type: "ActionSet",
                                                horizontalAlignment: "Center",
                                                spacing: "Small",
                                                actions: [
                                                    [
                                                        type: "Action.OpenUrl",
                                                        title: "Click Here to View Report",
                                                        url: "${reportUrl}",
                                                        style: "positive"
                                                    ]
                                                ]
                                            ],
                                            [
                                                type: "TextBlock",
                                                text: "${reportUrl}",
                                                size: "Small",
                                                color: "Light",
                                                isSubtle: true,
                                                horizontalAlignment: "Center",
                                                spacing: "Small",
                                                wrap: true
                                            ]
                                        ]
                                    ],
                                    // ── CHART SECTION ─────────────────────────────────────
                                    [
                                        type: "Container",
                                        style: "default",
                                        bleed: true,
                                        spacing: "Medium",
                                        separator: true,
                                        backgroundImage: [
                                            url: "https://dummyimage.com/1200x2/16213e/16213e.png",
                                            fillMode: "RepeatHorizontally"
                                        ],
                                        items: [
                                            [
                                                type: "TextBlock",
                                                text: "📊  TEST RESULTS SUMMARY",
                                                weight: "Bolder",
                                                size: "Medium",
                                                color: "Light",
                                                wrap: true
                                            ]
                                        ]
                                    ],
                                    [
                                        type: "Container",
                                        style: "default",
                                        spacing: "Medium",
                                        items: [
                                            [
                                                type: "ColumnSet",
                                                columns: [
                                                    [type: "Column", width: 2, items: []],
                                                    [
                                                        type: "Column",
                                                        width: 16,
                                                        items: [
                                                            [
                                                                type: "Image",
                                                                url: "${chartUrl}",
                                                                altText: "Test Results: Passed ${passed} | Failed ${failed} | Broken ${broken} | Skipped ${skipped}",
                                                                size: "Stretch",
                                                                horizontalAlignment: "Center",
                                                                spacing: "Small",
                                                                style: "default"
                                                            ]
                                                        ]
                                                    ],
                                                    [type: "Column", width: 2, items: []]
                                                ]
                                            ]
                                        ]
                                    ],
                                    // ── STATS GRID ────────────────────────────────────────
                                    [
                                        type: "ColumnSet",
                                        spacing: "Medium",
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
                                        spacing: "Medium",
                                        separator: true
                                    ],
                                    // ── BUILD INFO ────────────────────────────────────────
                                    [
                                        type: "Container",
                                        style: "default",
                                        bleed: true,
                                        spacing: "Medium",
                                        separator: true,
                                        backgroundImage: [
                                            url: "https://dummyimage.com/1200x2/16213e/16213e.png",
                                            fillMode: "RepeatHorizontally"
                                        ],
                                        items: [
                                            [
                                                type: "TextBlock",
                                                text: "🔧  BUILD INFORMATION",
                                                weight: "Bolder",
                                                size: "Medium",
                                                color: "Light",
                                                wrap: true
                                            ]
                                        ]
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
                                        type: "Container",
                                        style: "default",
                                        bleed: true,
                                        spacing: "Medium",
                                        separator: true,
                                        backgroundImage: [
                                            url: "https://dummyimage.com/1200x2/16213e/16213e.png",
                                            fillMode: "RepeatHorizontally"
                                        ],
                                        items: [
                                            [
                                                type: "TextBlock",
                                                text: "🔗  REPORT LINKS",
                                                weight: "Bolder",
                                                size: "Medium",
                                                color: "Light",
                                                wrap: true
                                            ]
                                        ]
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
        .header-td { background-color: #16213e !important; background-image: linear-gradient(#16213e, #16213e) !important; }
    .footer-td { background-color: #f7f8fa !important; }
    .chart-td  { background-color: #ffffff !important; }
        .header-kicker { color: #e8eef7 !important; }
        .header-title { color: #ffffff !important; }
        .header-meta { color: #e8eef7 !important; }
        .header-build { color: #ffffff !important; }
        .status-shell { background-color: #ffffff !important; }
        .status-badge { background-color: ${statusBgColor} !important; border: 2px solid ${statusColor} !important; }
        .status-badge-text { color: ${statusColor} !important; }
        .report-cta { background-color: #1e8449 !important; background-image: linear-gradient(#1e8449, #1e8449) !important; }
        .report-cta-text { color: #ffffff !important; }
        .report-cta-link { color: #d5f5e3 !important; }
        .report-button { background-color: #ffffff !important; }
        .report-button-link { color: #1e8449 !important; }
        .section-title { background-color: #16213e !important; background-image: linear-gradient(#16213e, #16213e) !important; color: #ffffff !important; }
        .total-row-cell { background-color: #16213e !important; background-image: linear-gradient(#16213e, #16213e) !important; }
        .total-row-text { color: #ffffff !important; }
        .total-row-accent { color: #61dafb !important; }
        .total-row-muted { color: #aabbdd !important; }
    @media (prefers-color-scheme: dark) {
      [data-ogsc] body,
      [data-ogsb] body { background-color: #f0f2f5 !important; }
      [data-ogsc] .card,
      [data-ogsb] .card { background-color: #ffffff !important; }
      [data-ogsc] .header-td,
      [data-ogsb] .header-td { background-color: ${bannerBgColor} !important; background-image: linear-gradient(${bannerBgColor}, ${bannerBgColor}) !important; }
      [data-ogsc] .status-shell,
      [data-ogsb] .status-shell { background-color: #ffffff !important; }
      [data-ogsc] .status-badge,
      [data-ogsb] .status-badge { background-color: ${statusBgColor} !important; border-color: ${statusColor} !important; }
      [data-ogsc] .status-badge-text,
      [data-ogsb] .status-badge-text { color: ${statusColor} !important; }
      [data-ogsc] .report-cta,
      [data-ogsb] .report-cta { background-color: #1e8449 !important; background-image: linear-gradient(#1e8449, #1e8449) !important; }
      [data-ogsc] .report-button,
      [data-ogsb] .report-button { background-color: #ffffff !important; }
      [data-ogsc] .section-title,
      [data-ogsb] .section-title { background-color: #16213e !important; background-image: linear-gradient(#16213e, #16213e) !important; color: #ffffff !important; }
      [data-ogsc] .total-row-cell,
      [data-ogsb] .total-row-cell { background-color: #16213e !important; background-image: linear-gradient(#16213e, #16213e) !important; }
      [data-ogsc] .header-kicker,
      [data-ogsb] .header-kicker { color: #e9f7ef !important; }
      [data-ogsc] .header-title,
      [data-ogsb] .header-title { color: #ffffff !important; }
      [data-ogsc] .header-meta,
      [data-ogsb] .header-meta { color: #f3f7f9 !important; }
      [data-ogsc] .header-build,
      [data-ogsb] .header-build { color: #ffffff !important; }
      [data-ogsc] .report-cta-text,
      [data-ogsb] .report-cta-text,
      [data-ogsc] .total-row-text,
      [data-ogsb] .total-row-text { color: #ffffff !important; }
      [data-ogsc] .report-cta-link,
      [data-ogsb] .report-cta-link,
      [data-ogsc] .total-row-muted,
      [data-ogsb] .total-row-muted { color: #aabbdd !important; }
      [data-ogsc] .report-button-link,
      [data-ogsb] .report-button-link,
      [data-ogsc] .total-row-accent,
      [data-ogsb] .total-row-accent { color: #61dafb !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0f2f5" style="background-color:#f0f2f5;padding:32px 0;">
<tr><td align="center">
<table class="card" width="640" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <tr>
                <td class="header-td" bgcolor="#16213e" style="background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:32px 40px;text-align:center;">
                        <p class="header-kicker" style="margin:0 0 6px 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#e8eef7;">Regression Test Suite</p>
                        <h1 class="header-title" style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">AUTOMATION PHASE 2 REPORT</h1>
                        <p class="header-meta" style="margin:10px 0 0;font-size:14px;color:#e8eef7;">
                                Build <span class="header-build" style="color:#ffffff;font-weight:700;">#${env.BUILD_NUMBER}</span>
        &nbsp;&bull;&nbsp;${gitBranch} @ ${gitCommit}
      </p>
    </td>
  </tr>

  <!-- STATUS BADGE -->
  <tr>
        <td class="status-shell" bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 40px 8px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                                <td class="status-badge" bgcolor="${statusBgColor}" style="background-color:${statusBgColor};border-radius:50px;border:2px solid ${statusColor};padding:8px 28px;">
                                        <span class="status-badge-text" style="color:${statusColor};font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
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
                      <td class="report-cta" bgcolor="#1e8449" style="background:#1e8449;background-color:#1e8449;background-image:linear-gradient(#1e8449,#1e8449);border-radius:10px;padding:20px;text-align:center;">
                        <p class="report-cta-text" style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#ffffff;">Full Interactive Allure Report &mdash; Opens in Browser</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                            <td class="report-button" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:8px;">
                                <a class="report-button-link" href="${reportUrl}" style="display:inline-block;padding:12px 32px;color:#1e8449;font-size:14px;font-weight:700;text-decoration:none;">Click Here to View Report</a>
              </td>
            </tr></table>
                        <p class="report-cta-link" style="margin:12px 0 0;font-size:11px;color:#d5f5e3;">${reportUrl}</p>
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
    <p class="section-title" style="margin:28px 0 10px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;text-transform:uppercase;background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:10px 14px;border-radius:8px;">Test Results Chart</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="chart-td" align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:12px;border:1px solid #e8eaed;border-radius:8px;">
            <!--[if mso]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:486px;height:356px;">
              <v:fill type="solid" color="#ffffff"/>
              <v:textbox inset="0,0,0,0">
            <![endif]-->
            <img src="${chartUrl}"
                 alt="Test Results: Passed ${passed} (${passRate}%) | Failed ${failed} (${failRate}%) | Broken ${broken} (${brokenRate}%) | Skipped ${skipped} (${skipRate}%) | Total ${total}"
                 width="486"
                 height="356"
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
    <p class="section-title" style="margin:28px 0 10px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;text-transform:uppercase;background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:10px 14px;border-radius:8px;">Test Results Summary</p>
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
                        <td class="total-row-cell" bgcolor="#16213e" style="background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:13px 16px;"><b class="total-row-text" style="color:#ffffff;font-size:14px;">📋 Total</b></td>
                        <td class="total-row-cell" bgcolor="#16213e" style="background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:13px 16px;text-align:center;font-size:20px;font-weight:800;color:#61dafb;"><span class="total-row-accent" style="color:#61dafb;">${total}</span></td>
                        <td class="total-row-cell" bgcolor="#16213e" style="background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:13px 16px;text-align:center;color:#aabbdd;font-size:13px;"><span class="total-row-muted" style="color:#aabbdd;">100%</span></td>
                        <td class="total-row-cell" bgcolor="#16213e" style="background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:13px 16px;"><span class="total-row-muted" style="color:#aabbdd;font-size:12px;">⏱️ ${testDur}</span></td>
          </tr>
        </tbody>
      </table>

      <!-- BUILD INFO TABLE -->
        <p class="section-title" style="margin:28px 0 10px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;text-transform:uppercase;background:#16213e;background-color:#16213e;background-image:linear-gradient(#16213e,#16213e);padding:10px 14px;border-radius:8px;">Build Information</p>
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
                    to: 'sugantha.mani@cdw.com,Vivekanandan.Raju@cdw.com,karthikeyan.jegadeesan@cdw.com,kishorkumar.dhanabose@cdw.com,tejavardhangoud.kalal@cdw.com',
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