document.addEventListener("DOMContentLoaded", () => {
  loadSection();
  document.addEventListener("keyup", (event) => {
    if (event.keyCode == 32) {
      handleTimer();
    }
  });
});

// Global variables
var timerIntervalIsRunning;
localStorage.setItem("showSolutions", JSON.stringify(true));
localStorage.setItem("nextCaseAfterSolve", JSON.stringify(true));

function changeToSection(section) {
  let url = new URL(window.location.href);
  url.searchParams.set("section", section);
  window.history.replaceState(null, null, url);
  loadSection();
}

function backToHomePage() {
  let url = new URL(window.location.href);
  url.searchParams.delete("section");
  window.history.replaceState(null, null, url);
  location.reload();
}

function loadSection() {
  let url = new URL(window.location.href);
  let section = url.searchParams.get("section");
  if (section) {
    loadingScreen();
    renderSectionHTML(section);
  }
}

function loadingScreen() {
  document.body.innerHTML = `
  <div class="h-100 d-flex flex-column align-items-center justify-content-center">
    <img src="static/loading_cube.gif" alt="Loading" width="100">
  </div>
      `;
}

function renderSectionHTML(section) {
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      let sectionData = data[section];
      let plainHTML = `
      <main class="mt-4">
        <ul class="nav nav-pills justify-content-center mb-1">
          <li class="nav-item">
            <label class="nav-link active" id="algorithmsPill" onclick="loadSection()">Algorithms</label>
          </li>
          <li class="nav-item">
            <label class="nav-link" id="trainerPill" onclick="loadTrainer()">Trainer</label>
          </li>
        </ul>
        <div id="pageContent">
          <h1>${sectionData.name}</h1>
          <p>${sectionData.description}</p>
          <button class="btn btn-sm btn-primary mb-2" onclick="backToHomePage()"><i class="bi bi-arrow-left"></i> Go back</button>
        </div>
      </main>
      `;

      document.body.innerHTML = plainHTML;

      pageContent = document.querySelector("#pageContent");

      for (subSection in sectionData.cases) {
        pageContent.innerHTML += `<h3>${subSection}</h3>`;
        pageContent.innerHTML += tableHTML(sectionData.cases[subSection]);
      }
    });
}

function tableHTML(cases) {
  let table = `
    <table class="table table-bordered text-center mt-3 mb-5">
        <thead>
            <th>ID</th>
            <th>Case</th>
            <th>Algorithms</th>
            <th>Group</th>
            <th>Train</th>
        </thead>
        <tbody>
    `;

  cases.forEach((element) => {
    // Check if case is checked for traning
    let checked = "";
    let casesToTrain = JSON.parse(localStorage.getItem("casesToTrain"));
    if (casesToTrain) {
      casesToTrain.forEach((algCase) => {
        if (algCase.id === element.id) {
          checked = "checked";
        }
      });
    }
    // Algorithms HTML
    let algHTML = "";
    element.algs.forEach((alg) => {
      algHTML += `<p>${alg}</p>`;
    });
    table += `
    <tr>
        <td>${element.id}</td>
        <td> <img src="http://cube.rider.biz/visualcube.php?fmt=svg&size=150&pzl=3&stage=f2l&alg=y${element.imgScramble}" width="90"> </td>
        <td>${algHTML}</td>
        <td>${element.group}</td>
        <td> <input type="checkbox" onchange="handleTrainCheckBoxChange(this, ${element.id})" ${checked}> </td>
    </tr>`;
  });

  table += `
        </tbody>
    </table>
  `;

  return table;
}

function handleTrainCheckBoxChange(checkbox, caseId) {
  if (checkbox.checked) {
    appendCase(caseId);
  } else {
    removeCase(caseId);
  }
}

function getCase(id) {
  // Get current section
  let url = new URL(window.location.href);
  let section = url.searchParams.get("section");
  // Get case
  return fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      let sectionCases = data[section].cases;

      for (subSection in sectionCases) {
        for (algCase in sectionCases[subSection]) {
          let currentCase = sectionCases[subSection][algCase];
          if (id === currentCase.id) {
            return currentCase;
          }
        }
      }
    });
}

function appendCase(id) {
  getCase(id).then((currentCase) => {
    let casesToTrain = JSON.parse(localStorage.getItem("casesToTrain"));
    if (!casesToTrain) {
      casesToTrain = [];
    }
    casesToTrain.push(currentCase);
    localStorage.setItem("casesToTrain", JSON.stringify(casesToTrain));
  });
}

function removeCase(id) {
  let casesToTrain = JSON.parse(localStorage.getItem("casesToTrain"));
  for (let i = 0; i < casesToTrain.length; i++) {
    if (casesToTrain[i].id == id) {
      casesToTrain.splice(i, 1);
      localStorage.setItem("casesToTrain", JSON.stringify(casesToTrain));
    }
  }
}

function loadTrainer() {
  // Change activated pill
  let algorithmsPill = document.querySelector("#algorithmsPill");
  let trainerPill = document.querySelector("#trainerPill");
  algorithmsPill.classList.remove("active");
  trainerPill.classList.add("active");

  renderTrainerHTML();
}

function renderTrainerHTML() {
  generateCase();
}

function generateCase() {
  // Get random to train case
  let casesToTrain = JSON.parse(localStorage.getItem("casesToTrain"));
  if (!casesToTrain || casesToTrain.length == 0) {
    alert("You have to at least select one case. xD");
  }
  let randomCase =
    casesToTrain[Math.floor(Math.random() * casesToTrain.length)];
  // Statistics HTML
  let times = JSON.parse(localStorage.getItem("times"));
  let mean = "<span class='text-success'>xD</span>";
  let timesHTML = "";
  if (times) {
    let sum = 0;
    times.reverse().forEach((time) => {
      // Mean
      sum += time;
      // Individual Times HTML
      timesHTML += `<span class="badge text-bg-success me-1">${time}</span>`;
    });
    mean = sum / times.length;
    mean = Math.round(mean * 100) / 100;
  }
  // Solutions HTML
  let solutionsHTML = "";
  randomCase["algs"].forEach((solution) => {
    solutionsHTML += `<p><mark>${solution}</mark></p>`;
  });
  // Options
  let checkedForShowSolutions = "";
  if (JSON.parse(localStorage.getItem("showSolutions"))) {
    checkedForShowSolutions = "checked";
  }

  let checkedForNextCaseAfterSolve = "";
  if (JSON.parse(localStorage.getItem("nextCaseAfterSolve"))) {
    checkedForNextCaseAfterSolve = "checked";
  }

  // Render case HTML
  let caseHTML = `
  <main class="text-center">
    <div class="text-end">
      <button class="btn btn-secondary" onclick="generateCase()"><i class="bi bi-arrow-right"></i></button>
      
    </div>
    <h3>${
      randomCase.scramble[
        Math.floor(Math.random() * randomCase.scramble.length)
      ]
    }</h3>    
    <img src="http://cube.rider.biz/visualcube.php?fmt=svg&size=150&pzl=3&stage=f2l&alg=y${
      randomCase.imgScramble
    }" width="250">

    <div class="display-3 mt-3 mb-4" id="timer">0.00</div>

    <div class="row">
      <div class="col-sm mb-4">
        <div class="card text-start">
          <div class="card-header">
            Statistics
          </div>
          <div class="card-body" id="statistics">
            <button class="btn btn-sm btn-danger mb-2" onclick="resetTimes()"><i class="bi bi-trash"></i></button>
            <p>Mean: <b>${mean}</b></p>
            ${timesHTML}
          </div>
        </div>
      </div>

      <div class="col-sm">
        <div class="card text-start">
          <div class="card-header">
            Solutions
          </div>
          <div class="card-body">
            <div class="mb-2">
            <input type="checkbox" id="showSolutions" onchange="handleShowSolutionsCheckBoxChange(this)" ${checkedForShowSolutions}>
            <label for="showSolutions">Show solutions</label>
            <br>
            <input type="checkbox" id="nextCase" onchange="handleNextCaseCheckBoxChange(this)" ${checkedForNextCaseAfterSolve}>
            <label for="nextCase">Go to next case after solve</label>
            </div>
            <div class="${!checkedForShowSolutions && "d-none"}" id="solutions">
              ${solutionsHTML}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  `;

  document.querySelector("#pageContent").innerHTML = caseHTML;
}

function handleTimer() {
  if (timerIntervalIsRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  let timerElement = document.querySelector("#timer");
  let seconds = 0;
  let milliseconds = 0;
  timerIntervalIsRunning = setInterval(() => {
    if (milliseconds == 99) {
      seconds++;
      milliseconds = 0;
    }
    timerElement.innerHTML = `${seconds}.${milliseconds}`;
    milliseconds++;
  }, 10);
}

function stopTimer() {
  clearInterval(timerIntervalIsRunning);
  saveTime();
  updateStatistics();
  checkToGoToNextCase();
  timerIntervalIsRunning = null;
}

function saveTime() {
  let timerElement = document.querySelector("#timer");
  let time = parseFloat(timerElement.innerHTML);
  let times = JSON.parse(localStorage.getItem("times"));
  if (!times) {
    times = [];
  }
  times.push(time);
  localStorage.setItem("times", JSON.stringify(times));
}

function resetTimes() {
  let times = JSON.parse(localStorage.getItem("times"));
  times = [];
  localStorage.setItem("times", JSON.stringify(times));
  updateStatistics();
}

function updateStatistics() {
  let statisticsElement = document.querySelector("#statistics");
  let times = JSON.parse(localStorage.getItem("times")).reverse();
  let timesHTML = "";
  if (times) {
    let sum = 0;
    times.forEach((time) => {
      // Mean
      sum += time;
      // Individual Times HTML
      timesHTML += `<span class="badge text-bg-success me-1">${time}</span>`;
    });
    mean = sum / times.length;
    mean = Math.round(mean * 100) / 100;
  }
  statisticsElement.innerHTML = `
  <button class="btn btn-sm btn-danger mb-2" onclick="resetTimes()"><i class="bi bi-trash"></i></button>
  <p>Mean: <b>${mean}</b></p>
  ${timesHTML}
  `;
}

function handleShowSolutionsCheckBoxChange(checkbox) {
  if (checkbox.checked) {
    localStorage.setItem("showSolutions", JSON.stringify(true));
    showSolution();
  } else {
    localStorage.setItem("showSolutions", JSON.stringify(false));
    hideSolution();
  }
}

function showSolution() {
  let solutionsElement = document.querySelector("#solutions");
  solutionsElement.classList.remove("d-none");
}

function hideSolution() {
  let solutionsElement = document.querySelector("#solutions");
  solutionsElement.classList.add("d-none");
}

function handleNextCaseCheckBoxChange(checkbox) {
  if (checkbox.checked) {
    localStorage.setItem("nextCaseAfterSolve", JSON.stringify(true));
  } else {
    localStorage.setItem("nextCaseAfterSolve", JSON.stringify(false));
  }
}

function checkToGoToNextCase() {
  if (JSON.parse(localStorage.getItem("nextCaseAfterSolve"))) {
    generateCase();
  }
}
