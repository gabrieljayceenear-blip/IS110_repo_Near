// Realistic Filipino Startup Baseline Logs (3 Phases)
const baselineMockLogs = [
    // Month 1 (January): Initial Setup. Buying a small starter colony of 100 ARC. Tub/tarp pond setup costs.
    { date: "2026-01-10", freq: "Monthly", stocked: 100, harvested: 0, feed: 2, gain: 0, deaths: 5, females: 20, berried: 0, eggs: 0, larvae: 0, juv: 0, revenue: 0, expenses: 5000 },
    
    // Month 3 (March): Grow-out phase. Buying feed. First signs of breeding (5 berried females).
    { date: "2026-03-15", freq: "Monthly", stocked: 0, harvested: 0, feed: 10, gain: 3, deaths: 2, females: 0, berried: 5, eggs: 200, larvae: 800, juv: 0, revenue: 0, expenses: 1500 },
    
    // Month 6 (June): First small harvest! Selling 40 market-sized adults. Hatched juveniles successfully reach nursery size.
    { date: "2026-06-01", freq: "Monthly", stocked: 0, harvested: 40, feed: 15, gain: 5, deaths: 1, females: 15, berried: 8, eggs: 250, larvae: 1500, juv: 400, revenue: 6000, expenses: 1800 }
];

let farmDataLedger = JSON.parse(localStorage.getItem('crayfish_dashboard_logs'));

if (!farmDataLedger || farmDataLedger.length === 0) {
    farmDataLedger = [...baselineMockLogs];
    localStorage.setItem('crayfish_dashboard_logs', JSON.stringify(farmDataLedger));
}

let mortalityPieObj, financialLineObj, fcrBarObj, breedingAnalysisObj;

// UPDATED: Completely disable all Chart.js rendering and hover animations globally
Chart.defaults.animation = false;

document.getElementById('log-date').valueAsDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    buildChartsEngine();
    processCalculationPipeline();
});

function buildChartsEngine() {
    mortalityPieObj = new Chart(document.getElementById('mortalityPieChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Survival Rate', 'Mortality Rate', 'On Pool / Missing'],
            datasets: [{ 
                data: [0, 0, 0], 
                backgroundColor: ['#198754', '#dc3545', '#cbd5e1'], 
                borderWidth: 2,
                hoverOffset: 0 // UPDATED: Stops the pie slices from popping out on hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                title: { display: true, text: 'Overall Stock Mortality Dynamic', font: { size: 14, weight: 'bold' } }, 
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) { label += context.parsed.toFixed(1) + '%'; }
                            return label;
                        }
                    }
                }    
            }
        }
    });

    financialLineObj = new Chart(document.getElementById('financialLineChart').getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Revenue', data: [], borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.05)', fill: true, tension: 0.1, borderWidth: 2, pointRadius: 4 },
            { label: 'Expenses', data: [], borderColor: '#ffc107', backgroundColor: 'transparent', fill: false, tension: 0.1, borderWidth: 2, pointRadius: 4 }
        ]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                title: { display: true, text: 'Financial Trend Over Time', font: { size: 14, weight: 'bold' } }, 
                legend: { labels: { boxWidth: 12, font: { size: 12 } } } 
            },
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } }, 
                x: { ticks: { font: { size: 11 } } } 
            }
        }
    });

    fcrBarObj = new Chart(document.getElementById('fcrBarChart').getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'FCR History', data: [], backgroundColor: '#6f42c1', barPercentage: 0.4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                title: { display: true, text: 'Feed Conversion Ratio History', font: { size: 14, weight: 'bold' } }, 
                legend: { labels: { boxWidth: 12, font: { size: 12 } } } 
            },
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } }, 
                x: { ticks: { font: { size: 11 } } } 
            }
        }
    });

    breedingAnalysisObj = new Chart(document.getElementById('breedingAnalysisChart').getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [
            { label: 'Breeding Success %', data: [], backgroundColor: 'rgba(13, 110, 253, 0.7)', order: 2, barPercentage: 0.4 },
            { label: 'Egg Hatch Rate %', data: [], backgroundColor: 'rgba(255, 193, 7, 0.7)', order: 3, barPercentage: 0.4 },
            { label: 'Juv Survival Rate %', data: [], type: 'line', borderColor: '#20c997', fill: false, tension: 0.2, order: 1, pointRadius: 4, borderWidth: 2 }
        ]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                title: { display: true, text: 'Hatchery Metrics & Efficiency Breakdown', font: { size: 14, weight: 'bold' } }, 
                legend: { labels: { boxWidth: 12, font: { size: 11 } } } 
            },
            scales: { 
                y: { beginAtZero: true, max: 100, ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } }, 
                x: { ticks: { font: { size: 11 } } } 
            }
        }
    });
}

function addLedgerEntry() {
    const juvHarvested = parseFloat(document.getElementById('in-juv-harvested').value) || 0;
    const baseStocked = parseFloat(document.getElementById('in-stocked').value) || 0;
    
    const combinedTotalStocked = baseStocked + juvHarvested;

    const newLog = {
        date: document.getElementById('log-date').value,
        freq: document.getElementById('log-freq').value,
        stocked: combinedTotalStocked,
        harvested: parseFloat(document.getElementById('in-harvested').value) || 0,
        feed: parseFloat(document.getElementById('in-feed').value) || 0,
        gain: parseFloat(document.getElementById('in-gain').value) || 0,
        deaths: parseFloat(document.getElementById('in-deaths').value) || 0,
        
        females: parseFloat(document.getElementById('in-total-females').value) || 0,
        berried: parseFloat(document.getElementById('in-berried-females').value) || 0,
        eggs: parseFloat(document.getElementById('in-avg-eggs').value) || 0,
        larvae: parseFloat(document.getElementById('in-hatched-larvae').value) || 0,
        juv: juvHarvested,
        
        revenue: parseFloat(document.getElementById('in-revenue').value) || 0,
        expenses: parseFloat(document.getElementById('in-expenses').value) || 0
    };

    farmDataLedger.push(newLog);
    farmDataLedger.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    localStorage.setItem('crayfish_dashboard_logs', JSON.stringify(farmDataLedger));
    processCalculationPipeline();
    
    document.getElementById('loggerForm').reset();
    document.getElementById('log-date').valueAsDate = new Date();
}

function wipeLocalCache() {
    if (confirm("Clear local operational memory storage? This cannot be undone.")) {
        farmDataLedger = [];
        localStorage.removeItem('crayfish_dashboard_logs');
        processCalculationPipeline();
    }
}

function processCalculationPipeline() {
    const tableBody = document.getElementById('historicalLedger').querySelector('tbody');
    
    if (farmDataLedger.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No logged records populated. Use form elements.</td></tr>`;
        resetKPIDisplaysToNull();
        return;
    }

    let globalStocked = 0, globalHarvested = 0, globalFeed = 0, globalGain = 0;
    let globalRevenue = 0, globalExpenses = 0, globalJuveniles = 0, globalDeaths = 0;

    let timeLabels = [], revenueTrack = [], expensesTrack = [], fcrTrack = [];
    let successRateData = [], eggHatchData = [], juvSurvivalData = [];
    let htmlGridOutput = "";

    farmDataLedger.forEach(item => {
        const s_stocked = item.stocked || 0;
        const s_harvested = item.harvested || 0;
        const s_feed = item.feed || 0;
        const s_gain = item.gain || 0;
        const s_deaths = item.deaths || 0;
        const s_females = item.females || 0;
        const s_berried = item.berried || 0;
        const s_eggs = item.eggs || 0;
        const s_larvae = item.larvae || 0;
        const s_juv = item.juv || 0;
        const s_rev = item.revenue || 0;
        const s_exp = item.expenses || 0;

        globalStocked += s_stocked;
        globalHarvested += s_harvested;
        globalFeed += s_feed;
        globalGain += s_gain;
        globalRevenue += s_rev;
        globalExpenses += s_exp;
        globalJuveniles += s_juv;
        globalDeaths += s_deaths;

        let calcFcr = s_gain > 0 ? (s_feed / s_gain) : 0;
        let calcMargin = s_rev > 0 ? ((s_rev - s_exp) / s_rev) * 100 : 0;
        let calcSuccess = s_females > 0 ? (s_berried / s_females) * 100 : 0;
        
        let potentialEggs = s_berried * s_eggs;
        let calcHatch = potentialEggs > 0 ? (s_larvae / potentialEggs) * 100 : 0;
        let calcJuvSurv = s_larvae > 0 ? (s_juv / s_larvae) * 100 : 0;

        const elementLabel = `${item.date || 'Unknown'} (${(item.freq || 'D').charAt(0)})`;
        timeLabels.push(elementLabel);
        revenueTrack.push(s_rev);
        expensesTrack.push(s_exp);
        fcrTrack.push(calcFcr);
        
        successRateData.push(calcSuccess);
        eggHatchData.push(calcHatch);
        juvSurvivalData.push(calcJuvSurv);

       htmlGridOutput += `
            <tr>
                <td>${item.date}</td>
                <td><span class="badge badge-freq">${item.freq}</span></td>
                <td>${s_stocked.toLocaleString()}</td>
                <td>${s_harvested.toLocaleString()}</td>
                <td class="text-danger fw-bold">${s_deaths.toLocaleString()}</td>
                <td class="text-success fw-bold">${s_juv.toLocaleString()}</td>
                <td class="${calcFcr > 2.0 ? 'text-danger fw-bold' : ''}">${calcFcr.toFixed(2)}</td>
                <td>₱${s_rev.toLocaleString()}</td>
                <td class="${calcMargin < 0 ? 'text-danger' : ''}">${calcMargin.toFixed(1)}%</td>
            </tr>
        `;  
    });

    tableBody.innerHTML = htmlGridOutput;

    let finalSurvivalRate = globalStocked > 0 ? (globalHarvested / globalStocked) * 100 : 0;
    let finalMortalityRate = globalStocked > 0 ? (globalDeaths / globalStocked) * 100 : 0;
    let finalFCR = globalGain > 0 ? (globalFeed / globalGain) : 0;
    let finalProfitMargin = globalRevenue > 0 ? ((globalRevenue - globalExpenses) / globalRevenue) * 100 : 0;
    
    let unaccountedRate = Math.max(0, 100 - (finalSurvivalRate + finalMortalityRate));

    updateKPICardColor('kpi-survival', `${finalSurvivalRate.toFixed(1)}%`, finalSurvivalRate >= 80 && finalSurvivalRate <= 100);
    updateKPICardColor('kpi-fcr', finalFCR.toFixed(2), finalFCR > 0 && finalFCR <= 2.0);
    updateKPICardColor('kpi-margin', `${finalProfitMargin.toFixed(1)}%`, finalProfitMargin > 0);
    document.getElementById('kpi-stocked').innerText = globalStocked.toLocaleString();
    document.getElementById('kpi-deaths').innerText = globalDeaths.toLocaleString();
    document.getElementById('kpi-juv').innerText = globalJuveniles.toLocaleString();
    

    mortalityPieObj.data.datasets[0].data = [finalSurvivalRate, finalMortalityRate, unaccountedRate];
    mortalityPieObj.update();

    financialLineObj.data.labels = timeLabels;
    financialLineObj.data.datasets[0].data = revenueTrack;
    financialLineObj.data.datasets[1].data = expensesTrack;
    financialLineObj.update();

    fcrBarObj.data.labels = timeLabels;
    fcrBarObj.data.datasets[0].data = fcrTrack;
    fcrBarObj.update();

    breedingAnalysisObj.data.labels = timeLabels;
    breedingAnalysisObj.data.datasets[0].data = successRateData;
    breedingAnalysisObj.data.datasets[1].data = eggHatchData;
    breedingAnalysisObj.data.datasets[2].data = juvSurvivalData;
    breedingAnalysisObj.update();
}

function updateKPICardColor(targetId, textValue, passingCondition) {
    const el = document.getElementById(targetId);
    el.innerText = textValue;
    el.className = passingCondition ? "kpi-metric text-success" : "kpi-metric text-danger";
}

function resetKPIDisplaysToNull() {
    ['kpi-survival', 'kpi-margin'].forEach(id => document.getElementById(id).innerText = "0.0%");
    document.getElementById('kpi-fcr').innerText = "0.00";
    document.getElementById('kpi-juv').innerText = "0";
    document.getElementById('kpi-stocked').innerText = "0";
    document.getElementById('kpi-deaths').innerText = "0";
    
    ['kpi-survival', 'kpi-fcr', 'kpi-margin'].forEach(id => document.getElementById(id).className = "kpi-metric text-navy");

    mortalityPieObj.data.datasets[0].data = [0, 0, 0]; mortalityPieObj.update();
    financialLineObj.data.labels = []; financialLineObj.data.datasets[0].data = []; financialLineObj.data.datasets[1].data = []; financialLineObj.update();
    fcrBarObj.data.labels = []; fcrBarObj.data.datasets[0].data = []; fcrBarObj.update();
    
    breedingAnalysisObj.data.labels = [];
    breedingAnalysisObj.data.datasets.forEach(d => d.data = []);
    breedingAnalysisObj.update();
}