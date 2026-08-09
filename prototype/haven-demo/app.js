const views = document.querySelectorAll('.view');
const navigation = document.querySelectorAll('[data-view-target]');
const navItems = document.querySelectorAll('.nav-item');
const workflowDetail = document.querySelector('#workflow-detail');

// Lightweight prototype state only - not a production assessment or scoring model.
const assessmentState = {
  journeyStage: null,
  experienceMoment: null,
  provisionalHpi: 82,
  observation: {
    checklist: [],
    notes: '',
    rating: '',
    saved: false
  }
};

const observationStorageKey = 'haven.front-desk-greeting-observation.v1';
const journeyStages = ['Pre-arrival', 'Arrival & Welcome', 'Stay', 'Departure'];
const arrivalMoments = [
  'Exterior Arrival',
  'Parking / Valet',
  'Front Entrance',
  'Lobby',
  'Front Desk Greeting',
  'Check-In',
  'Bell Service',
  'Wayfinding',
  'Elevator Experience'
];
const frontDeskGreetingChecklist = [
  'Guest acknowledged promptly',
  'Eye contact established',
  'Greeting felt genuine and welcoming',
  'Guest name used when appropriate',
  'Staff appearance was professional',
  'Wait time was communicated',
  'Next steps were explained clearly',
  'Guest was thanked / welcomed'
];

const workflowContent = {
  property: {
    label: '01 · Property context',
    title: 'A clear view of the property and its priorities.',
    copy: 'Ocean Breeze Resort is a 214-key luxury coastal resort. The engagement is centered on the moments that shape first impression, in-stay confidence, and future-stay intent.',
    sideLabel: 'Assessment focus',
    sideTitle: 'Arrival, stay & departure',
    tags: ['Guest journey', 'Service consistency', 'Loyalty intent']
  },
  observation: {
    label: '04 · Observation',
    title: 'Capture what occurred before interpretation.',
    copy: 'Choose an experience moment before capturing an observation.',
    sideLabel: 'Selected experience moment',
    sideTitle: 'Choose a moment first',
    tags: ['Objective record', 'No conclusions yet']
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function restorePrototypeObservation() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(observationStorageKey));
    if (!stored || !stored.observation) return;
    assessmentState.observation = {
      checklist: Array.isArray(stored.observation.checklist) ? stored.observation.checklist : [],
      notes: typeof stored.observation.notes === 'string' ? stored.observation.notes : '',
      rating: typeof stored.observation.rating === 'string' ? stored.observation.rating : '',
      saved: stored.observation.saved === true
    };
    assessmentState.provisionalHpi = stored.provisionalHpi === 83 ? 83 : 82;
  } catch {
    // A fresh prototype session is a safe fallback if browser session data is unavailable.
  }
}

function updateAssessmentIndicators() {
  const propertyHpi = document.querySelector('.property-score strong');
  if (propertyHpi) propertyHpi.textContent = assessmentState.provisionalHpi;

  const reportHpi = document.querySelector('#report .hpi-ring strong');
  if (reportHpi) reportHpi.textContent = assessmentState.provisionalHpi;

  const momentStep = document.querySelector('.workflow-step[data-stage="moment"]');
  if (momentStep) {
    const stepNote = momentStep.querySelector('small');
    momentStep.classList.toggle('is-complete', assessmentState.observation.saved);
    if (stepNote) stepNote.textContent = assessmentState.observation.saved ? 'Front desk complete' : 'What matters most';
  }

  const reportStep = document.querySelector('.report-step');
  if (reportStep) {
    const stepNote = reportStep.querySelector('small');
    reportStep.classList.toggle('is-ready', assessmentState.observation.saved);
    if (stepNote) stepNote.textContent = assessmentState.observation.saved ? 'Ready to view' : 'What to do next';
  }

  const reportAction = document.querySelector('#assessment .header-actions .primary-button[data-view-target="report"]');
  if (reportAction) reportAction.textContent = assessmentState.observation.saved ? 'View executive report' : 'Generate executive report';
}

function saveObservation() {
  const form = document.querySelector('.observation-workspace');
  if (!form) return;

  assessmentState.observation = {
    checklist: [...form.querySelectorAll('input[name="front-desk-checklist"]:checked')].map(input => input.value),
    notes: form.querySelector('#consultant-notes')?.value || '',
    rating: form.querySelector('input[name="preliminary-rating"]:checked')?.value || '',
    saved: true
  };
  // Demo-only behavior: this one saved observation moves the illustrative score once.
  assessmentState.provisionalHpi = 83;
  sessionStorage.setItem(observationStorageKey, JSON.stringify({
    observation: assessmentState.observation,
    provisionalHpi: assessmentState.provisionalHpi
  }));
  updateAssessmentIndicators();
  renderWorkflow('observation');
}

function resetDemo() {
  // This is intentionally comprehensive for the isolated prototype origin.
  sessionStorage.clear();
  localStorage.clear();
  window.location.reload();
}

function showView(target) {
  views.forEach(view => view.classList.toggle('active-view', view.id === target));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.viewTarget === target));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSide(label, title, tags = []) {
  return `<aside class="detail-side"><small>${label}</small><strong>${title}</strong><div>${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></aside>`;
}

function renderJourneySelector() {
  const selectedJourney = assessmentState.journeyStage;
  const momentPicker = selectedJourney === 'Arrival & Welcome'
    ? `<div class="experience-moment-picker">
        <p class="selection-label">Experience moments <span>Choose the part of arrival you want to evaluate.</span></p>
        <div class="moment-options" role="list" aria-label="Arrival and welcome experience moments">
          ${arrivalMoments.map(moment => `<button class="moment-option${assessmentState.experienceMoment === moment ? ' selected' : ''}" data-experience-moment="${moment}" role="listitem" aria-pressed="${assessmentState.experienceMoment === moment}">${moment}</button>`).join('')}
        </div>
      </div>`
    : selectedJourney
      ? `<p class="selection-guidance">Experience moments for <strong>${selectedJourney}</strong> will be added as the assessment library expands.</p>`
      : '';

  return `<div>
    <p class="detail-label">02 · Guest journey</p>
    <h3>Choose where the guest experience is taking place.</h3>
    <p>Start with the part of the journey you intend to evaluate. HAVEN keeps the consultant focused on the guest's experience, not on records or fields.</p>
    <div class="journey-selector">
      <p class="selection-label">Guest journey stage</p>
      <div class="journey-stage-list" role="list" aria-label="Guest journey stages">
        ${journeyStages.map(stage => `<button class="journey-stage${selectedJourney === stage ? ' selected' : ''}" data-journey-stage="${stage}" role="listitem" aria-pressed="${selectedJourney === stage}">${stage}</button>`).join('')}
      </div>
    </div>
    ${momentPicker}
  </div>${renderSide('Selected journey stage', selectedJourney || 'Not yet selected', selectedJourney ? ['Guest journey'] : ['Choose a stage'])}`;
}

function renderExperienceMoment() {
  const selectedMoment = assessmentState.experienceMoment;
  if (!selectedMoment) {
    return `<div><p class="detail-label">03 · Experience moment</p><h3>Choose a journey stage first.</h3><p>Experience Moments become available after you select a part of the guest journey.</p><button class="text-button workflow-return" data-workflow-stage="journey">Choose guest journey <span>&rarr;</span></button></div>${renderSide('Selected experience moment', 'Not yet selected', ['Guest journey first'])}`;
  }

  return `<div>
    <p class="detail-label">03 · Experience moment</p>
    <h3>${selectedMoment}</h3>
    <p>This is the selected point in the guest journey. The next workspace will use it to place each observation in the right guest-experience context.</p>
    <div class="selected-moment-summary"><small>Selected experience moment</small><strong>${selectedMoment}</strong><button class="text-button workflow-return" data-workflow-stage="journey">Change selection <span>&rarr;</span></button><button class="text-button workflow-return" data-workflow-stage="observation">Open observation workspace <span>&rarr;</span></button></div>
  </div>${renderSide('Selected experience moment', selectedMoment, [assessmentState.journeyStage, assessmentState.observation.saved ? 'Completed' : 'Ready for observation'].filter(Boolean))}`;
}

function renderObservationWorkspace() {
  if (assessmentState.experienceMoment !== 'Front Desk Greeting') {
    const content = workflowContent.observation;
    const sideTitle = assessmentState.experienceMoment || content.sideTitle;
    return `<div><p class="detail-label">${content.label}</p><h3>${content.title}</h3><p>${content.copy}</p><button class="text-button workflow-return" data-workflow-stage="journey">Choose experience moment <span>&rarr;</span></button></div>${renderSide(content.sideLabel, sideTitle, content.tags)}`;
  }

  const savedNotice = assessmentState.observation.saved
    ? `<div class="observation-saved" role="status"><div><strong>Observation saved</strong><span>Front Desk Greeting is complete for this prototype assessment.</span></div><div><small>Provisional demo HPI</small><strong>82 <span>&rarr;</span> 83</strong></div></div>`
    : '';

  return `<form class="observation-workspace" aria-label="Front Desk Greeting observation worksheet">
    <header class="observation-context">
      <div><p class="detail-label">04 · Observation workspace</p><h3>Front Desk Greeting</h3><p>Evaluate the guest's first direct interaction with front desk staff.</p></div>
      <div class="moment-context"><small>Guest journey</small><strong>${assessmentState.journeyStage}</strong></div>
    </header>
    ${savedNotice}

    <fieldset class="checklist-section">
      <legend>Observation checklist</legend>
      <p>Record what you observed at this moment. These prototype prompts can be refined by the assessment team.</p>
      <div class="checklist-items">
        ${frontDeskGreetingChecklist.map((item, index) => `<label class="checklist-item" for="front-desk-check-${index}"><input id="front-desk-check-${index}" type="checkbox" name="front-desk-checklist" value="${item}"${assessmentState.observation.checklist.includes(item) ? ' checked' : ''}><span>${item}</span></label>`).join('')}
      </div>
    </fieldset>

    <div class="observation-lower-grid">
      <section class="notes-section">
        <label for="consultant-notes">Consultant notes</label>
        <textarea id="consultant-notes" name="consultant-notes" rows="7" placeholder="Capture objective details, wording, timing, or context that will help during office review.">${escapeHtml(assessmentState.observation.notes)}</textarea>
      </section>
      <aside class="evidence-section">
        <p>Evidence</p>
        <small>Prototype controls - collection and linking will be added later.</small>
        <div class="evidence-controls">
          <button type="button">Add photo</button>
          <button type="button">Add voice note</button>
          <button type="button">Add written observation</button>
        </div>
      </aside>
    </div>

    <fieldset class="rating-section">
      <legend>Preliminary rating</legend>
      <p>Use a provisional assessment only. Interpretation remains reviewable.</p>
      <div class="rating-options">
        ${['N/A', 'Poor', 'Fair', 'Good', 'Excellent'].map((rating, index) => `<label for="rating-${index}"><input id="rating-${index}" type="radio" name="preliminary-rating" value="${rating}"${assessmentState.observation.rating === rating ? ' checked' : ''}><span>${rating}</span></label>`).join('')}
      </div>
    </fieldset>

    <div class="observation-actions"><button type="button" id="save-observation" class="primary-button">Save observation</button><small>Prototype save only · the provisional HPI is demonstration logic, not a production calculation.</small></div>
  </form>`;
}

function renderWorkflow(stage) {
  if (stage === 'journey') {
    workflowDetail.innerHTML = renderJourneySelector();
  } else if (stage === 'moment') {
    workflowDetail.innerHTML = renderExperienceMoment();
  } else if (stage === 'observation') {
    workflowDetail.innerHTML = renderObservationWorkspace();
  } else {
    const content = workflowContent[stage];
    if (!content) return;
    workflowDetail.innerHTML = `<div><p class="detail-label">${content.label}</p><h3>${content.title}</h3><p>${content.copy}</p></div>${renderSide(content.sideLabel, content.sideTitle, content.tags)}`;
  }

  document.querySelectorAll('.workflow-step[data-stage]').forEach(step => {
    const active = step.dataset.stage === stage;
    step.classList.toggle('active', active);
    step.setAttribute('aria-selected', String(active));
  });

  document.querySelectorAll('[data-journey-stage]').forEach(button => button.addEventListener('click', () => {
    assessmentState.journeyStage = button.dataset.journeyStage;
    assessmentState.experienceMoment = null;
    renderWorkflow('journey');
  }));

  document.querySelectorAll('[data-experience-moment]').forEach(button => button.addEventListener('click', () => {
    assessmentState.experienceMoment = button.dataset.experienceMoment;
    renderWorkflow(button.dataset.experienceMoment === 'Front Desk Greeting' ? 'observation' : 'moment');
  }));

  document.querySelectorAll('[data-workflow-stage]').forEach(button => button.addEventListener('click', () => renderWorkflow(button.dataset.workflowStage)));
  document.querySelector('#save-observation')?.addEventListener('click', saveObservation);
  updateAssessmentIndicators();
}

navigation.forEach(control => control.addEventListener('click', event => {
  event.preventDefault();
  const requiresSavedObservation = control.dataset.viewTarget === 'report' && !control.classList.contains('nav-item');
  if (requiresSavedObservation && !assessmentState.observation.saved) {
    showView('assessment');
    renderWorkflow('observation');
    return;
  }
  showView(control.dataset.viewTarget);
}));

document.querySelectorAll('.workflow-step[data-stage]').forEach(step => step.addEventListener('click', () => renderWorkflow(step.dataset.stage)));
document.querySelector('#print-report').addEventListener('click', () => window.print());
document.querySelector('#reset-demo')?.addEventListener('click', resetDemo);
restorePrototypeObservation();
updateAssessmentIndicators();
renderWorkflow('property');
