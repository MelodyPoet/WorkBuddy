// ===== 时钟 =====
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleString('zh-CN');
}
setInterval(updateClock, 1000);
updateClock();

// ===== 推送模式切换 =====
function handlePushModeChange() {
  const mode = document.getElementById('push-mode').value;
  const timeGroup = document.getElementById('push-time-group');
  const intervalGroup = document.getElementById('urge-interval-group');
  const repeatGroup = document.getElementById('push-repeat-group');
  const templateGroup = document.getElementById('msg-template-group');
  
  if (mode === 'urge') {
    // 催工模式：显示间隔设置，隐藏时间和重复设置
    timeGroup.style.display = 'none';
    intervalGroup.style.display = 'block';
    repeatGroup.style.display = 'none';
    templateGroup.style.display = 'none';
    
    // 更新催工间隔显示
    updateUrgeIntervalDisplay();
  } else {
    // 其他模式：显示时间和重复设置，隐藏间隔设置
    timeGroup.style.display = 'block';
    intervalGroup.style.display = 'none';
    repeatGroup.style.display = 'block';
    templateGroup.style.display = 'block';
  }
}

// 更新催工间隔显示
function updateUrgeIntervalDisplay() {
  const intervalInput = document.getElementById('urge-interval');
  if (!intervalInput) return;
  
  const intervalValue = parseInt(intervalInput.value) || 30;
  const intervalDisplay = document.getElementById('urge-interval-display');
  const intervalTag = document.getElementById('urge-interval-tag');
  
  if (intervalDisplay) {
    intervalDisplay.textContent = `每${intervalValue}秒`;
  }
  if (intervalTag) {
    intervalTag.textContent = `每${intervalValue}秒推送`;
  }
}

// 页面加载时初始化推送模式
document.addEventListener('DOMContentLoaded', function() {
  const pushModeSelect = document.getElementById('push-mode');
  const urgeIntervalInput = document.getElementById('urge-interval');
  
  if (pushModeSelect) {
    pushModeSelect.addEventListener('change', handlePushModeChange);
    handlePushModeChange(); // 初始调用以设置正确状态
  }
  
  // 为催工间隔输入框添加实时更新事件
  if (urgeIntervalInput) {
    urgeIntervalInput.addEventListener('input', function() {
      if (document.getElementById('push-mode').value === 'urge') {
        updateUrgeIntervalDisplay();
      }
    });
    // 初始化显示
    if (document.getElementById('push-mode').value === 'urge') {
      updateUrgeIntervalDisplay();
    }
  }
});

// ===== Tab 切换 =====
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'chat' && !window.chartsInited) initCharts();
  if (name === 'kpi' && !window.kpiChartsInited) initKPICharts();
}

// ===== Toast =====
function showToast(msg, type='success', icon='✅') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideOut .3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ===== 部门选择 =====
const selectedDepts = new Set(['sales']);
function toggleDept(dept) {
  const el = document.getElementById('dept-' + dept);
  if (selectedDepts.has(dept)) { if (selectedDepts.size > 1) { selectedDepts.delete(dept); el.classList.remove('selected'); } }
  else { selectedDepts.add(dept); el.classList.add('selected'); }
  const names = {'sales':'销售部','market':'市场部','purchase':'采购部','hr':'人事部','finance':'财务部','tech':'技术部'};
  document.getElementById('selected-depts').textContent = [...selectedDepts].map(d=>names[d]).join('、');
}

// ===== 创建任务 =====
function createTask() {
  const title = document.getElementById('task-title').value || '未命名任务';
  showToast(`任务「${title}」创建成功，准备推送`, 'success', '✅');
  addLog(`任务创建：${title}`, 'green');
  // 更新统计
  animateNum('stat-sent', 0, 3);
}

// ===== 推送 =====
let pushInterval = null;
function startPush() {
  const mode = document.getElementById('push-mode').value;
  const title = document.getElementById('task-title').value || 'Q1医院销售计划';
  
  if (mode === 'urge') {
    // 催工模式：启动自动催工
    if (isUrgeRunning) {
      showToast('自动催工已在运行中', 'warning', '⏰');
      return;
    }
    
    addLog(`🚀 启动自动催工任务（可配置间隔）`, 'orange');
    showToast('自动催工任务已启动配置', 'success', '🔔');
    
    // 启动催工
    startAutoUrge();
    
  } else {
    // 原有推送模式
    addLog(`开始${mode==='now'?'立即':'定时'}推送任务：${title}`, 'green');
    showToast('推送启动，正在分发至选定部门员工', 'success', '📤');

    const employees = [
      {name:'张伟', dept:'销售部'},
      {name:'李娜', dept:'销售部'},
      {name:'王芳', dept:'销售部'},
      {name:'陈志远', dept:'销售部'},
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i >= employees.length) { clearInterval(t); addLog('全员推送完成 ✓', 'green'); return; }
      const e = employees[i++];
      addLog(`✅ 已推送给 ${e.name}（${e.dept}）`, 'blue');
      showToast(`任务已推送至 ${e.name}`, 'info', '📨');
    }, 800);

    // 更新统计计数
    setTimeout(() => animateNum('stat-sent', 0, 4), 200);
    setTimeout(() => animateNum('stat-replied', 0, 3), 2500);
    setTimeout(() => animateNum('stat-inprogress', 0, 3), 3500);
    setTimeout(() => { animateNum('stat-completed', 0, 12); document.getElementById('reply-rate').textContent = '75'; }, 4000);
  }
}

function addLog(msg, color='green') {
  const log = document.getElementById('push-log');
  if (log.children.length === 1 && log.children[0].style.textAlign === 'center') log.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'push-animation';
  div.innerHTML = `<div class="push-dot" style="background:var(--wx-${color==='blue'?'blue':'green'})"></div><span style="font-size:12px;flex:1">${msg}</span><span style="font-size:11px;color:var(--text-sub)">${new Date().toLocaleTimeString('zh-CN')}</span>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function animateNum(id, from, to) {
  const el = document.getElementById(id);
  let cur = from;
  const step = (to - from) / 20;
  const t = setInterval(() => {
    cur += step;
    if (cur >= to) { el.textContent = to; clearInterval(t); return; }
    el.textContent = Math.floor(cur);
  }, 50);
}

// ===== 聊天数据 =====
// 智能体独立配置（机器人头像）
const agentConfig = {
  avatarBg: '#07C160',
  avatarText: '🤖',
  name: '智能体员工'
};

const chatData = {
  agent: {
    name: '智能体员工', sub: '自动化任务助手 · 在线',
    avatarBg: agentConfig.avatarBg, avatarText: agentConfig.avatarText,
    messages: [
      { from: 'bot', time: '09:00', type: 'card', card: {
        title: '📋 任务分配通知',
        items: [['任务','Q1医院销售计划制定'],['部门','销售部全员'],['截止','2026-03-20 17:00'],['优先级','高']],
        btns: ['确认接收','查看详情']
      }},
      { from: 'bot', time: '09:00', text: '各位销售同事，以上是本季度重点任务，请尽快制定各自区域的销售计划并回复执行安排。如有困难请及时反馈。' },
      { from: 'me', time: '09:15', text: '收到！我们销售部会尽快响应。' },
      { from: 'bot', time: '11:30', text: '📊 进度提醒：距离任务截止还有4天，请及时更新任务进展。目前已有2位同事完成回复，请未回复的同事尽快处理。' },
    ]
  },
  zhang: {
    name: '张伟 · 销售经理', sub: '销售部 · 华东区负责人',
    avatarBg: '#1677FF', avatarText: '张',
    messages: [
      { from: 'bot', time: '09:00', text: '张伟经理，您好！智能体为您分配了新任务：Q1医院销售计划制定，请查看并安排执行。' },
      { from: 'me', time: '09:08', text: '收到，我会尽快制定华东区的销售计划。' },
      { from: 'bot', time: '09:08', text: '好的！如需查看往期医院客户资料或报价模板，可直接在企业微信文档中获取。有问题随时反馈~' },
      { from: 'me', time: '09:15', text: '已联系华东区12家目标医院，8家有意向，本周完成5家正式拜访，进度65%。' },
      { from: 'bot', time: '09:16', text: '🎉 进度反馈已记录！完成率65%，进展顺利。已同步至老板看板。请继续加油！' },
    ]
  },
  li: {
    name: '李娜 · 销售顾问', sub: '销售部 · 华北区负责人',
    avatarBg: '#FF6B35', avatarText: '李',
    messages: [
      { from: 'bot', time: '09:00', text: '李娜，新任务来啦！请制定华北区医院销售计划，包括北京、天津、河北地区目标医院。' },
      { from: 'me', time: '10:32', text: '我负责华北区，已拜访协和、北大人民医院，对方很感兴趣！正在整理定制方案。' },
      { from: 'bot', time: '10:33', text: '很好！记得重点突出医院IT基础设施升级的价值主张。进度40%已记录✅' },
      { from: 'me', time: '10:45', text: '好的，我会重点强调稳定性和售后服务保障。预计周三提交方案给客户。' },
    ]
  },
  wang: {
    name: '王芳 · 销售专员', sub: '销售部 · 华南区负责人',
    avatarBg: '#7B2FBE', avatarText: '王',
    messages: [
      { from: 'bot', time: '09:00', text: '王芳，华南区销售计划任务已分配，请优先重点医院的开发。' },
      { from: 'me', time: '11:05', text: '遇到困难：华南区大医院都走政府采购，周期2-3个月。另外竞品最近降价10%，很有压力...' },
      { from: 'bot', time: '11:06', text: '⚠️ 已记录您的困难反馈，并已自动通知销售总监和CEO。建议您同时开拓私立医院渠道，周期更短。我们会尽快安排支援！' },
      { from: 'me', time: '11:20', text: '好的，我先开拓私立医院，同时等公司给政府采购平台注册支持。' },
    ]
  },
  chen: {
    name: '陈志远 · 销售专员', sub: '销售部 · 西南区负责人',
    avatarBg: '#06b6d4', avatarText: '陈',
    messages: [
      { from: 'bot', time: '09:00', text: '陈志远，西南区（成都、重庆、昆明）的销售计划请优先制定，重点覆盖三甲医院。' },
      { from: 'me', time: '09:48', text: '报告！西南区计划已完成，覆盖15家目标医院，下周正式启动拜访，预计季度内签约8单！' },
      { from: 'bot', time: '09:49', text: '🌟 超棒！西南区进度85%，您是本次任务执行最快的同事！KPI评分已标记为S级。CEO已看到这个好消息~' },
    ]
  },
  boss: {
    name: '林总 · CEO', sub: '公司管理层 · 查看汇总报告',
    avatarBg: '#f59e0b', avatarText: '👔',
    messages: [
      { from: 'bot', time: '11:30', text: '林总，以下是Q1医院销售任务执行汇报：\n\n✅ 张伟（华东）：65% 进展顺利\n✅ 陈志远（西南）：85% 超预期\n🔵 李娜（华北）：40% 执行中\n⚠️ 王芳（华南）：20% 遇到困难——政府采购周期长+竞品降价，建议关注。\n\n整体完成率：41.9%' },
      { from: 'me', time: '11:35', text: '整体进展如何？有没有需要我出面协调的？' },
      { from: 'bot', time: '11:35', text: '华南区需要重点关注，建议您与王芳沟通政府采购策略调整，并评估是否需要对竞品降价做出反应。其余区域进展正常。已为您生成详细考核看板，请查阅。' },
    ]
  }
};

let currentChat = 'agent';

function switchChat(name) {
  currentChat = name;
  document.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active'));
  document.getElementById('chatitem-' + name).classList.add('active');
  const data = chatData[name];
  document.getElementById('chat-header-avatar').style.background = data.avatarBg;
  document.getElementById('chat-header-avatar').textContent = data.avatarText;
  document.getElementById('chat-header-name').textContent = data.name;
  document.getElementById('chat-header-sub').textContent = data.sub;
  // 隐藏徽章
  const badge = document.getElementById('badge-' + name);
  if (badge) badge.style.display = 'none';
  renderMessages(name);
}

function renderMessages(name) {
  const msgs = chatData[name].messages;
  const data = chatData[name];
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  msgs.forEach((m, i) => {
    if (m.type === 'card') {
      const row = document.createElement('div');
      row.className = 'msg-row';
      // 卡片消息：智能体发的卡片使用智能体头像
      const isBotCard = m.from === 'bot';
      const cardAvatarBg = isBotCard ? agentConfig.avatarBg : data.avatarBg;
      const cardAvatarTxt = isBotCard ? agentConfig.avatarText : data.avatarText;
      row.innerHTML = `
        <div class="msg-avatar" style="background:${cardAvatarBg}">${cardAvatarTxt}</div>
        <div>
          <div class="msg-bubble" style="background:#fff;border-radius:0 10px 10px 10px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
            <div class="msg-card">
              <div class="msg-card-title">${m.card.title}</div>
              ${m.card.items.map(([k,v]) => `<div class="msg-card-item">${k}：<span>${v}</span></div>`).join('')}
              <div class="msg-card-action">${m.card.btns.map(b => `<div class="msg-card-btn">${b}</div>`).join('')}</div>
            </div>
          </div>
          <div class="msg-time">${m.time}</div>
        </div>`;
      container.appendChild(row);
    } else {
      const isMe = m.from === 'me';
      const isBot = m.from === 'bot';
      const row = document.createElement('div');
      row.className = 'msg-row' + (isMe ? ' me' : '');
      // 智能体消息使用智能体头像，用户消息使用会话头像，"我"的消息使用固定头像
      const avatarBg = isMe ? '#07C160' : (isBot ? agentConfig.avatarBg : data.avatarBg);
      const avatarTxt = isMe ? '我' : (isBot ? agentConfig.avatarText : data.avatarText);
      row.innerHTML = `
        <div class="msg-avatar" style="background:${avatarBg}">${avatarTxt}</div>
        <div>
          <div class="msg-bubble">${m.text.replace(/\n/g,'<br>')}</div>
          <div class="msg-time">${m.time}</div>
        </div>`;
      container.appendChild(row);
    }
  });
  container.scrollTop = container.scrollHeight;
}

function sendChatMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  const timeStr = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
  chatData[currentChat].messages.push({ from: 'me', time: timeStr, text });
  input.value = '';
  renderMessages(currentChat);
  recordMsg('me', currentChat);
  // 禁用输入框，等待 AI 回复
  input.disabled = true;
  const sendBtn = input.nextElementSibling;
  if (sendBtn) sendBtn.disabled = true;

  sendMsgWithAI(text, currentChat).then(reply => {
    const t = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
    chatData[currentChat].messages.push({ from: 'bot', time: t, text: reply });
    renderMessages(currentChat);
    recordMsg('bot', currentChat);
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  });
}

function sendTaskCard() {
  chatData[currentChat].messages.push({ from: 'bot', time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}), type: 'card', card: {
    title: '📋 ' + (document.getElementById('task-title').value || '销售任务'),
    items: [['优先级','高'],['截止','2026-03-20 17:00'],['发布人','智能体']],
    btns: ['确认接收','反馈进度']
  }});
  renderMessages(currentChat);
  recordMsg('bot', currentChat);
  showToast('任务卡片已发送', 'success', '📋');
}

function sendProgressRequest() {
  chatData[currentChat].messages.push({ from: 'bot', time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}), text: '📊 请问您目前任务进度如何？请回复：1.当前完成百分比 2.遇到的主要困难 3.预计完成时间' });
  renderMessages(currentChat);
  recordMsg('bot', currentChat);
  showToast('进度汇报请求已发送', 'info', '📊');
}

// 初始化聊天
renderMessages('agent');

// ===== 员工反馈 =====
// 员工信息映射
const empMeta = {
  '张伟 · 销售经理':   { avatarBg: '#1677FF', avatarTxt: '张', region: '华东区', kpiKey: 'zhang' },
  '李娜 · 销售顾问':   { avatarBg: '#FF6B35', avatarTxt: '李', region: '华北区', kpiKey: 'li'    },
  '王芳 · 销售专员':   { avatarBg: '#7B2FBE', avatarTxt: '王', region: '华南区', kpiKey: 'wang'  },
  '陈志远 · 销售专员': { avatarBg: '#06b6d4', avatarTxt: '陈', region: '西南区', kpiKey: 'chen'  },
};

// 各员工当前进度（初始值与页面一致）
const empProgress = { zhang: 65, li: 40, wang: 20, chen: 85 };

const typeNames = { progress:'进度更新', difficulty:'遇到困难', plan:'计划调整', complete:'任务完成' };
const typeTagClass = { progress:'tag-blue', difficulty:'tag-orange', plan:'tag-blue', complete:'tag-green' };
const typeBorderColor = { progress:'var(--wx-blue)', difficulty:'var(--wx-orange)', plan:'var(--wx-blue)', complete:'var(--wx-green)' };
const typeBarClass = { progress:'progress-blue', difficulty:'progress-orange', plan:'progress-blue', complete:'progress-green' };
const typeDotClass = { progress:'blue', difficulty:'orange', plan:'blue', complete:'' };

function submitFeedback() {
  const emp      = document.getElementById('fb-employee').value;
  const type     = document.getElementById('fb-type').value;
  const progress = parseInt(document.getElementById('fb-progress').value, 10);
  const content  = document.getElementById('fb-content').value.trim() || '（已提交反馈）';
  const now      = new Date();
  const timeStr  = now.toLocaleString('zh-CN');
  const timeShort= now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });

  const meta = empMeta[emp] || { avatarBg:'#07C160', avatarTxt:'?', region:'未知', kpiKey:'' };

  // ── 1. 更新反馈汇总卡片（插到最顶部）──────────────────────────────
  const feedbackList = document.getElementById('feedback-list');
  const newCard = document.createElement('div');
  newCard.className = 'feedback-card';
  newCard.style.cssText = `border-left:3px solid ${typeBorderColor[type]};animation:fadeIn .4s ease`;
  newCard.innerHTML = `
    <div class="feedback-header">
      <div class="feedback-employee">
        <div class="feedback-avatar" style="background:${meta.avatarBg}">${meta.avatarTxt}</div>
        <div>
          <div style="font-size:13px;font-weight:600">${emp}</div>
          <div style="font-size:11px;color:var(--text-sub)">${timeStr}</div>
        </div>
      </div>
      <span class="tag ${typeTagClass[type]}">${typeNames[type]}</span>
    </div>
    <div style="font-size:13px;line-height:1.6;margin-bottom:8px">${content}</div>
    <div style="display:flex;gap:12px;font-size:12px;color:var(--text-sub)">
      <span>📍 执行进度：<strong style="color:${typeBorderColor[type]}">${progress}%</strong></span>
      <span>📅 更新时间：<strong>${timeShort}</strong></span>
      <span>🗺️ 负责区域：<strong>${meta.region}</strong></span>
    </div>
    <div class="progress-wrap" style="margin-top:8px">
      <div class="progress-bar ${typeBarClass[type]}" style="width:${progress}%"></div>
    </div>`;
  feedbackList.insertBefore(newCard, feedbackList.firstChild);

  // ── 2. 更新时间线 ──────────────────────────────────────────────────
  const tl = document.getElementById('task-timeline');
  const tlItem = document.createElement('div');
  tlItem.className = 'timeline-item';
  tlItem.innerHTML = `
    <div class="timeline-dot ${typeDotClass[type]}"></div>
    <div class="timeline-time">${timeStr}</div>
    <div class="timeline-content"><strong>${emp}</strong> 提交【${typeNames[type]}】：${content.slice(0,50)}${content.length>50?'…':''}（进度 ${progress}%）</div>`;
  tl.insertBefore(tlItem, tl.children[tl.children.length - 1]);

  // ── 3. 同步更新 KPI 看板 ──────────────────────────────────────────
  if (meta.kpiKey) {
    empProgress[meta.kpiKey] = progress;
    syncKPIDashboard(meta.kpiKey, progress, type, emp, content);
  }

  // ── 4. Toast 通知 ──────────────────────────────────────────────────
  showToast(`${emp} 反馈已实时更新，进度 ${progress}%`, 'success', '📋');

  // ── 5. 重置表单 ────────────────────────────────────────────────────
  document.getElementById('fb-content').value = '';
  document.getElementById('fb-progress').value = 50;
  document.getElementById('fb-progress-val').textContent = '50%';
}

// ===== KPI 看板全量同步 =====
// 各员工对应的销售目标（万元）
const empTargetMap  = { zhang: 150, li: 120, wang: 130, chen: 100 };
// 评分规则
function calcGrade(pct) {
  if (pct >= 80) return { grade:'S', color:'var(--wx-green)',   tagClass:'tag-green',  label:'优秀'  };
  if (pct >= 60) return { grade:'A', color:'var(--wx-green)',   tagClass:'tag-green',  label:'正常'  };
  if (pct >= 40) return { grade:'B', color:'var(--wx-blue)',    tagClass:'tag-blue',   label:'跟进中' };
  if (pct >= 20) return { grade:'C', color:'var(--wx-orange)',  tagClass:'tag-orange', label:'需支持' };
  return           { grade:'D', color:'#ff4d4f',            tagClass:'tag-red',    label:'预警'  };
}
// 进度条颜色
function progressBarClass(pct) {
  if (pct >= 60) return 'progress-green';
  if (pct >= 35) return 'progress-blue';
  return 'progress-orange';
}

function syncKPIDashboard(key, pct, fbType, empName, fbContent) {
  // ── A. 表格行 ────────────────────────────────────────────────────
  const row = document.querySelector(`#kpi-table-body tr[data-key="${key}"]`);
  if (row) {
    // 进度条 + 百分比文字
    const bar     = row.querySelector('.td-progress .progress-bar');
    const pctSpan = row.querySelector('.td-progress span');
    if (bar)     { bar.style.width = pct + '%'; bar.className = 'progress-bar ' + progressBarClass(pct); }
    if (pctSpan) { const c = pct>=60?'var(--wx-green)':pct>=35?'var(--wx-blue)':'var(--wx-orange)'; pctSpan.textContent = pct + '%'; pctSpan.style.color = c; }
    // 当前完成额（按进度比例推算）
    const amountEl = row.querySelector('.td-amount');
    if (amountEl) {
      const target = empTargetMap[key] || 100;
      amountEl.textContent = '¥' + Math.round(target * pct / 100) + '万';
    }
    // KPI 评级
    const gInfo   = calcGrade(pct);
    const gradeEl = row.querySelector('.td-grade span');
    if (gradeEl)  { gradeEl.textContent = gInfo.grade; gradeEl.style.color = gInfo.color; }
    // 状态 Tag
    const statusEl = row.querySelector('.td-status span');
    if (statusEl)  { statusEl.className = 'tag ' + gInfo.tagClass; statusEl.textContent = gInfo.label; }
    // 任务完成时增加签约数（模拟）
    if (fbType === 'complete') {
      const signedEl = row.querySelector('.td-signed');
      if (signedEl) signedEl.textContent = parseInt(signedEl.textContent || 0) + 1;
    }
  }

  // ── B. 顶部4格指标 ───────────────────────────────────────────────
  // 整体完成率（4人平均）
  const vals = Object.values(empProgress);
  const avg  = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  const overallEl = document.getElementById('kpi-overall-rate');
  if (overallEl) overallEl.textContent = avg + '%';

  // 当前完成总销售额
  const totalSold = Object.entries(empProgress).reduce((sum, [k, v]) => sum + Math.round((empTargetMap[k] || 100) * v / 100), 0);
  const currentEl = document.getElementById('kpi-current');
  if (currentEl) currentEl.textContent = '¥' + totalSold + '万';

  // 风险项计数（完成率<30% 的人数）
  const riskCount = Object.values(empProgress).filter(v => v < 30).length;
  const riskCountEl = document.getElementById('kpi-risk-count');
  if (riskCountEl) {
    riskCountEl.textContent = riskCount;
    riskCountEl.style.color = riskCount > 0 ? '#f87171' : '#07C160';
  }
  // 风险描述
  const riskDescEl = document.getElementById('kpi-risk-desc');
  if (riskDescEl) {
    const riskNames = { zhang:'张伟·华东区', li:'李娜·华北区', wang:'王芳·华南区', chen:'陈志远·西南区' };
    const riskPeople = Object.entries(empProgress).filter(([,v]) => v < 30).map(([k]) => riskNames[k]);
    riskDescEl.textContent = riskPeople.length ? riskPeople.join('、') + '需关注' : '暂无风险 ✓';
    riskDescEl.style.color = riskPeople.length ? '#f87171' : '#07C160';
  }

  // ── C. 柱状图 ────────────────────────────────────────────────────
  if (window.kpiChart) {
    const order = ['zhang', 'li', 'wang', 'chen'];
    kpiChart.data.datasets[1].data = order.map(k => empProgress[k]);
    kpiChart.update('active');
  }

  // ── D. API 响应面板实时刷新 ──────────────────────────────────────
  const apiEl = document.getElementById('api-response');
  if (apiEl) {
    const memberNames = { zhang:'张伟', li:'李娜', wang:'王芳', chen:'陈志远' };
    const members = Object.entries(empProgress).map(([k, v]) => {
      const g = calcGrade(v).grade;
      return `&nbsp;&nbsp;&nbsp;&nbsp;{<span style="color:#60a5fa">"name"</span>:<span style="color:#86efac">"${memberNames[k]}"</span>,<span style="color:#60a5fa">"rate"</span>:<span style="color:#fbbf24">${v}</span>,<span style="color:#60a5fa">"grade"</span>:<span style="color:#86efac">"${g}"</span>}`;
    });
    apiEl.innerHTML =
      `<span style="color:#07C160">{</span><br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"code"</span>: 200,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"dept"</span>: <span style="color:#86efac">"sales"</span>,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"period"</span>: <span style="color:#86efac">"2026-Q1"</span>,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"overall_rate"</span>: <span style="color:#fbbf24">${avg}</span>,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"total_sold"</span>: <span style="color:#fbbf24">${totalSold}</span>,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"updated_by"</span>: <span style="color:#86efac">"${empName}"</span>,<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"members"</span>: [<br>` +
      members.join(',<br>') + `<br>&nbsp;&nbsp;],<br>` +
      `&nbsp;&nbsp;<span style="color:#60a5fa">"risk_items"</span>: <span style="color:#fbbf24">${riskCount}</span><br>` +
      `<span style="color:#07C160">}</span>`;
  }

  // ── E. 风险预警区动态更新 ────────────────────────────────────────
  // 仅当风险类型反馈时追加一条预警
  if (fbType === 'difficulty' || pct < 25) {
    const riskList = document.getElementById('risk-list');
    if (riskList) {
      const warn = document.createElement('div');
      warn.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px;background:#fff8f0;border-radius:8px;border-left:3px solid var(--wx-orange);margin-bottom:10px;animation:fadeIn .4s ease';
      warn.innerHTML = `<span style="font-size:20px">⚠️</span>
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${empName} 新反馈 — ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style="font-size:12px;color:var(--text-sub);line-height:1.6">${fbContent.slice(0,80)}${fbContent.length>80?'…':''} <strong>当前进度：${pct}%</strong></div>
        </div>`;
      riskList.insertBefore(warn, riskList.firstChild);
    }
  }
  // 任务完成时追加一条正向提示
  if (fbType === 'complete' || pct >= 90) {
    const riskList = document.getElementById('risk-list');
    if (riskList) {
      const good = document.createElement('div');
      good.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px;background:#f0fdf6;border-radius:8px;border-left:3px solid var(--wx-green);margin-bottom:10px;animation:fadeIn .4s ease';
      good.innerHTML = `<span style="font-size:20px">✅</span>
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${empName} 进度达 ${pct}% — ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style="font-size:12px;color:var(--text-sub);line-height:1.6">进展优秀，建议给予表扬并分享经验至其他区域团队。</div>
        </div>`;
      riskList.insertBefore(good, riskList.firstChild);
    }
  }
}

// ===== KPI 看板 =====
function refreshKPI() {
  showToast('数据已刷新', 'info', '🔄');
  if (window.kpiChart) {
    kpiChart.data.datasets[0].data = [68, 42, 22, 87].map(v => v + Math.floor(Math.random()*5 - 2));
    kpiChart.update();
  }
}

function callAPI() {
  showToast('API 请求成功，数据已返回', 'success', '🔌');
}

function exportReport() {
  showToast('考核报告已生成，正在下载...', 'info', '📥');
}

function sendAlert() {
  showToast('支援通知已推送给销售总监和王芳', 'warning', '📤');
  chatData['wang'].messages.push({ from: 'bot', time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}), text: '🔔 总部支援通知：CEO已关注华南区困难情况，销售总监将于明日与您电话沟通策略调整。同时建议优先开拓华南区私立医院，3家已筛选名单已发至您邮箱。加油！💪' });
  showToast('支援通知已发送给王芳', 'warning', '⚠️');
}

// ===== 消息统计状态 =====
const chatStats = {
  // 每小时推送数（key = 小时字符串 如 "09"）
  pushByHour: { '09':4, '10':2, '11':3, '12':1, '13':2, '14':1 },
  // 各员工：是否已回复
  replied: { zhang: true, li: true, wang: true, chen: true, boss: false },
  // 各员工响应时间（分钟）
  respTime: { zhang: 8, li: 23, wang: 45, chen: 12 },
  // 总推送条数
  totalPush: 13,
};

// 当前小时标签
function currentHourLabel() {
  return new Date().getHours().toString().padStart(2, '0');
}

// 收到"我"发出的消息时，统计推送量；收到员工回复时，更新回复状态
function recordMsg(from, chatKey) {
  const h = currentHourLabel();
  if (from === 'bot') {
    // 智能体发消息 = 一次推送
    chatStats.pushByHour[h] = (chatStats.pushByHour[h] || 0) + 1;
    chatStats.totalPush += 1;
  } else {
    // 员工/用户回复 = 标记为已回复
    if (chatKey && chatKey in chatStats.replied) chatStats.replied[chatKey] = true;
    // 若第一次回复，缩短响应时间（模拟更快反馈）
    if (chatKey && chatStats.respTime[chatKey]) {
      chatStats.respTime[chatKey] = Math.max(1, chatStats.respTime[chatKey] - Math.floor(Math.random() * 3 + 1));
    }
  }
  updateChatCharts();
}

function updateChatCharts() {
  if (!window.chartPushInst || !window.chartReplyInst) return;

  // ── 1. 推送统计柱状图 ────────────────────────────────────────────
  const hours = ['09','10','11','12','13','14','15','16'];
  const nowH  = currentHourLabel();
  // 确保当前小时出现在横轴
  if (!hours.includes(nowH)) hours.push(nowH);
  const labels = hours.map(h => h + ':00');
  const data   = hours.map(h => chatStats.pushByHour[h] || 0);
  chartPushInst.data.labels = labels;
  chartPushInst.data.datasets[0].data = data;
  chartPushInst.update('active');

  // 更新标题角标
  const tagEl = document.getElementById('chat-push-count-tag');
  if (tagEl) tagEl.textContent = '共' + chatStats.totalPush + '条';

  // ── 2. 回复率甜甜圈 ──────────────────────────────────────────────
  const total    = Object.keys(chatStats.replied).length;
  const repliedN = Object.values(chatStats.replied).filter(Boolean).length;
  const replyPct = Math.round(repliedN / total * 100);
  chartReplyInst.data.datasets[0].data = [replyPct, 100 - replyPct];
  chartReplyInst.update('active');
  const pctEl = document.getElementById('chat-reply-pct');
  if (pctEl) pctEl.textContent = replyPct + '%';

  // ── 3. 响应时间进度条 ────────────────────────────────────────────
  // 响应越快进度条越长（最快1分钟=100%，最慢60分钟=5%）
  Object.entries(chatStats.respTime).forEach(([key, mins]) => {
    const row = document.querySelector(`.resp-row[data-key="${key}"]`);
    if (!row) return;
    const bar   = row.querySelector('.resp-bar');
    const label = row.querySelector('.resp-label');
    const pct   = Math.max(5, Math.round((1 - (mins - 1) / 59) * 100));
    const color = mins <= 10 ? 'var(--wx-green)' : mins <= 30 ? 'var(--wx-blue)' : 'var(--wx-orange)';
    const barCls = mins <= 10 ? 'progress-green' : mins <= 30 ? 'progress-blue' : 'progress-orange';
    if (bar)   { bar.style.width = pct + '%'; bar.className = 'progress-bar resp-bar ' + barCls; }
    if (label) { label.textContent = mins + '分钟'; label.style.color = color; }
  });
}

// ===== 图表 =====
let chartsInited = false;
function initCharts() {
  chartsInited = true;
  // 推送统计
  window.chartPushInst = new Chart(document.getElementById('chartPush'), {
    type: 'bar',
    data: {
      labels: ['09:00','10:00','11:00','12:00','13:00','14:00'],
      datasets: [{ label: '推送数量', data: [4, 2, 3, 1, 2, 1], backgroundColor: '#07C160', borderRadius: 6 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
  // 回复率
  window.chartReplyInst = new Chart(document.getElementById('chartReply'), {
    type: 'doughnut',
    data: {
      labels: ['已回复', '未回复'],
      datasets: [{ data: [75, 25], backgroundColor: ['#07C160','#f0f0f0'], borderWidth: 0 }]
    },
    options: { cutout: '65%', plugins: { legend: { position: 'bottom' } } }
  });
}

let kpiChartsInited = false;
window.kpiChart = null;
function initKPICharts() {
  kpiChartsInited = true;
  // 区域完成率
  window.kpiChart = new Chart(document.getElementById('chartKPI'), {
    type: 'bar',
    data: {
      labels: ['华东·张伟', '华北·李娜', '华南·王芳', '西南·陈志远'],
      datasets: [
        { label: '目标(%)', data: [100,100,100,100], backgroundColor: 'rgba(0,0,0,.06)', borderRadius: 4 },
        { label: '完成率(%)', data: [65,40,20,85], backgroundColor: ['#07C160','#1677FF','#FF6B35','#06b6d4'], borderRadius: 4 }
      ]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, max: 110, ticks: { callback: v => v + '%' } } }
    }
  });
  // 销售趋势
  new Chart(document.getElementById('chartTrend'), {
    type: 'line',
    data: {
      labels: ['3/1','3/3','3/5','3/7','3/9','3/11','3/14'],
      datasets: [
        { label: '累计销售额(万)', data: [20, 55, 90, 120, 165, 210, 243], borderColor: '#07C160', backgroundColor: 'rgba(7,193,96,.08)', fill: true, tension: 0.4, pointRadius: 4 },
        { label: '目标线(万)', data: [83,113,143,173,203,233,263], borderColor: '#e0e0e0', borderDash: [5,5], pointRadius: 0 }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: false } } }
  });
}


// ===================================================
// 🧠 智能情绪感知对话系统
// ===================================================

// 员工姓名简称映射
const empShortName = { agent:'同事们', zhang:'张伟', li:'李娜', wang:'王芳', chen:'陈志远', boss:'林总' };

/**
 * 情绪关键词规则库
 * 每条规则：{ keywords, weight, type, replies[] }
 * type: 'stress'|'tired'|'progress_good'|'progress_bad'|'difficulty'|'done'|'encourage'|'general'
 */
const emotionRules = [
  // ─── 负面情绪：压力/焦虑 ───
  {
    type: 'stress',
    keywords: ['压力','好难','太难','搞不定','不行了','担心','焦虑','紧张','害怕','怕','头疼','烦','崩溃'],
    replies: [
      '😊 听起来你最近压力不小，先深呼吸一下~ 其实遇到挑战说明你在做有价值的事！我们一起来拆解一下难题，有什么具体卡点可以告诉我，我来帮你想方案 💪',
      '🤗 能感受到你的压力，这很正常。销售本来就有起伏，重要的是找到突破口。你已经在认真对待这件事，这本身就很棒。有什么我能帮到你的？',
      '💙 先别给自己太大压力，目标是用来努力的方向，不是用来焦虑的枷锁。你目前的进展已经很不错了，继续保持节奏就好~',
      '🌟 感谢你把真实状态告诉我！遇到困难是成长的机会，我已将你的情况同步给销售总监，他很快会与你沟通支援方案。你不是一个人在战斗！',
    ]
  },
  // ─── 负面情绪：疲惫/辛苦 ───
  {
    type: 'tired',
    keywords: ['累','疲','辛苦','熬夜','加班','没睡好','精力','撑不住','太多了','忙不过来'],
    replies: [
      '💙 辛苦啦！听到你这么努力真的很心疼。工作重要，但身体更重要。如果手头有可以延后的事，我们来帮你重新排排优先级，好吗？',
      '🌸 你已经很拼了！适当的休息反而能提升效率。今天完成最重要的一件事就够了，其他的明天继续，我会帮你跟进节奏~',
      '☕ 给自己倒杯水，休息5分钟再继续。你这段时间的付出我都记录在案了，年终绩效的时候一定不会亏待你的 😄',
      '🤝 感谢你这么努力地推进任务！我来帮你把今天必须完成的事情梳理一下，让工作更有条理，你可以更从容地应对。',
    ]
  },
  // ─── 遇到困难/障碍 ───
  {
    type: 'difficulty',
    keywords: ['困难','问题','障碍','卡','流程','不配合','竞争对手','降价','拒绝','没意向','失联','联系不上','采购'],
    replies: [
      '⚠️ 已记录这个困难！这类情况很常见，建议从几个角度突破：①换联系人②强调差异化服务③请总监出面背书。具体方案要帮你制定吗？',
      '💡 遇到阻力很正常，竞品降价说明市场在活跃。咱们的优势在于售后服务和本地化支持，这些是竞品很难复制的。我已经把这个问题上报给销售总监了~',
      '🔍 我帮你分析一下这个卡点：如果是采购流程问题，可以同步走私立医院渠道；如果是客户意向问题，可以请我安排一次产品演示。你倾向哪个方向？',
      '🛡️ 困难已同步至风险预警看板，CEO和销售总监都会看到。公司不会让你孤军奋战的！建议你先整理一份客户异议清单，我来帮你生成应对话术。',
    ]
  },
  // ─── 进度好/顺利 ───
  {
    type: 'progress_good',
    keywords: ['顺利','不错','进展好','完成','签约','意向','谈妥','成了','搞定','完美','棒','很好','很顺','效果好','有眉目'],
    replies: [
      '🎉 太棒了！进展顺利真的让人振奋！这个好消息已经同步到CEO看板了，林总看到一定会很高兴。继续保持这个势头！',
      '🏆 你真的太厉害了！这个节奏下去，季度目标妥妥完成！我已经把你的进度标记为优先案例，其他区域的同事可以向你学习~',
      '✨ 进展顺利是最好的消息！我已更新你的KPI评分，继续冲！如果后续需要合同模板或报价支持，随时叫我 😊',
      '🌟 哇，真棒！你的执行力是团队里最强的之一。这种正能量很有感染力，我会在团队周报里特别提及你的进展，给大家加加油！',
    ]
  },
  // ─── 进度落后/担心完不成 ───
  {
    type: 'progress_bad',
    keywords: ['没完成','进度慢','落后','不够','差得远','完不成','来不及','时间不够','只有','才多少','还差'],
    replies: [
      '💪 别灰心！距离截止还有时间，我们来算一下：如果每天能推进X%，完全来得及追上。关键是找到效率最高的那几个动作，我来帮你梳理。',
      '📊 进度有点落后没关系，重要的是现在就行动！我来帮你做一个冲刺计划：今天重点联系哪几家客户、明天跟进哪个方案，一步一步来。',
      '🤗 我看了一下你的情况，其实差距没有你想象的那么大。关键资源我已经帮你准备好了，你来发力，我来做你的后盾！',
      '⚡ 来，我们一起搞个小目标：今天争取推进10%。千里之行始于足下，先迈出这一步，后面会越来越有感觉的！你可以的！',
    ]
  },
  // ─── 任务完成 ───
  {
    type: 'done',
    keywords: ['完成了','完成','交了','提交','做完','结束了','搞完','收工'],
    replies: [
      '🎊 恭喜完成任务！你的执行力杠杠的，已同步至系统并通知CEO。好好休息一下，你赢了这一仗！',
      '✅ 任务完成确认！KPI数据已更新，这次的表现会记入你的季度绩效。感谢你的付出，团队因为有你更棒！',
      '🥳 完美收工！我已经为你生成了任务完成报告，并同步到林总看板。你今天的工作非常出色，明天继续保持~',
    ]
  },
  // ─── 求助/请求支持 ───
  {
    type: 'help',
    keywords: ['帮我','帮帮','支持','需要','资源','资料','模板','方案','怎么','如何','能不能','请问','请帮'],
    replies: [
      '🙋 收到你的求助！我马上来安排：①相关资料已发至你企业微信文件夹 ②销售总监已收到通知 ③明天上午9点前会有具体支援方案给你。稍等一下~',
      '📁 没问题！我来帮你协调资源。请问你最急需的是：A.产品资料/报价模板 B.客户拜访话术 C.竞品对比分析？回复字母就好，我立刻处理！',
      '💼 求助已接收！这个问题我来处理，保证不超过2小时给你回复。在等待的过程中，你可以先看看历史成功案例，里面有不少实用技巧~',
      '🤝 好的，我来帮你！已将你的需求标记为"紧急支持"，销售总监会在今天内与你联系。你不用一个人扛，团队都在！',
    ]
  },
  // ─── 打招呼/一般 ───
  {
    type: 'general',
    keywords: ['你好','早','嗯','好的','收到','知道了','没问题','明白','了解','ok','OK'],
    replies: [
      '😊 收到！有什么需要随时找我，我一直都在线~',
      '👍 好的，我这边已记录。如果有最新进展，随时发给我！',
      '✅ 明白啦！继续加油，有问题随时说~',
      '💬 好！我会持续关注你的进展，有需要帮忙的随时告诉我 😄',
    ]
  },
];

/**
 * 核心函数：根据文字内容生成情绪感知回复
 */
function generateSmartReply(text, chatKey) {
  const name = empShortName[chatKey] || '你';
  const textLower = text.toLowerCase();

  // 命中得分
  let bestRule = null;
  let bestScore = 0;

  emotionRules.forEach(rule => {
    let score = 0;
    rule.keywords.forEach(kw => {
      if (textLower.includes(kw)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  });

  // 没有命中任何情绪关键词 → 通用进度感知回复
  if (!bestRule || bestScore === 0) {
    // 尝试提取数字百分比
    const pctMatch = text.match(/(\d{1,3})\s*%/);
    if (pctMatch) {
      const pct = parseInt(pctMatch[1]);
      if (pct >= 80) {
        return `🌟 ${name}，进度${pct}%，非常出色！已同步至KPI看板，距离目标只剩最后一步了，冲冲冲！`;
      } else if (pct >= 50) {
        return `👍 ${name}，进度${pct}%，状态不错！保持这个节奏，你完全可以按时完成。有什么需要支持的吗？`;
      } else if (pct >= 25) {
        return `💪 ${name}，进度${pct}%，还有很大空间！我来帮你分析一下关键推进点，一起制定冲刺方案吧~`;
      } else {
        return `🤗 ${name}，进度${pct}%，现在正是发力的时候！我已经把你的情况标注给销售总监，支援资源马上到位，你不用一个人扛！`;
      }
    }
    // 完全通用回复
    const generalReplies = [
      `📝 收到，${name}！你的反馈已记录并同步至系统。继续加油，有任何问题随时告诉我~`,
      `✅ 好的，${name}！数据已同步至考核看板。需要我帮你做什么吗？`,
      `💬 明白了，${name}！我会持续关注你的进展，如有需要随时联系我 😊`,
    ];
    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
  }

  // 从命中规则中随机选一条回复
  const pool = bestRule.replies;
  let reply = pool[Math.floor(Math.random() * pool.length)];

  // 若不是通用类型，在回复末尾加上数据同步提示
  if (bestRule.type !== 'general' && bestRule.type !== 'done') {
    reply += `\n\n（${name}的反馈已自动记录，相关数据已同步至KPI看板 📊）`;
  }

  return reply;
}

// ===================================================
// ⏰ 自动催工任务系统（可配置时间间隔）
// ===================================================

let autoUrgeTimer = null;       // 主定时器
let urgeCountdownTimer = null;  // 倒计时显示器
let urgeSecondsLeft = 30;       // 倒计时秒数（初始值）
let isUrgeRunning = false;
let urgeRound = 0;              // 第几轮催工
let urgeIntervalSeconds = 30;   // 催工间隔秒数（可配置）

// 各员工的催工消息池（轮换发送，避免重复）
const urgeMessages = [
  [
    '⏰ 【进度询问】各位同事，现在是定期进度跟进时间！请问您目前任务完成到哪里了？请回复当前百分比~',
    '📊 【催工提醒】距离任务截止还有几天，请更新一下您的最新进展，方便统一汇报给林总。',
    '🔔 【智能体提醒】我是自动催工助手！请简单回复一下：1️⃣ 当前进度 2️⃣ 今日计划 3️⃣ 有无困难',
  ],
  [
    '📋 【进度收集】本轮进度汇报开始！请回复您的任务完成情况，系统将自动同步至KPI看板。',
    '💼 【定时询问】销售任务跟进中，请回复您的当前状态。如有困难请直接说明，我来帮您协调资源！',
    '🚀 【冲刺提醒】离截止日期越来越近，您的进度怎么样？有什么需要支援的，现在说还来得及！',
  ],
  [
    '🎯 【精准催工】根据系统数据，您本月目标还有缺口，今天有哪些推进计划？',
    '📡 【智能跟进】任务追踪提醒：请分享一下今天的实际进展，哪怕只是小小的一步也很棒！',
    '⚡ 【紧急跟进】距本周截止节点不足48小时，请立即更新进度！如有阻碍请第一时间反馈，我来处理。',
  ],
];

// 每位员工的个性化催工语
const personalUrge = {
  zhang: [
    '张伟经理，华东区进展最近如何？本周5家拜访计划都安排好了吗？💪',
    '张哥，抽空更新一下进度，林总等会儿要看报告哦~ 你的华东区一直是标杆，不能掉链子！',
    '张伟，智能体准时签到催工！你们华东区有什么好消息吗？期待你的进展更新~ 😊',
  ],
  li: [
    '李娜，华北区的定制方案周三能提交给客户吗？协和那边有新进展吗？',
    '李娜，最近跟单顺利吗？北京市场竞争激烈，需要什么支持资源请及时说！💙',
    '李姐，来汇报一下最新进展呗～ 华北区你是主力，大家都很期待好消息！',
  ],
  wang: [
    '王芳，华南区的情况最近怎么样？私立医院渠道有新进展吗？有困难就说，我帮你上报！',
    '王芳，加油！华南区虽然遇到了采购流程的挑战，但你的韧劲儿大家都看到了。今天有什么进展？',
    '王姐，最近压力大吗？遇到问题别一个人扛，随时告诉我，团队支援随时待命！💜',
  ],
  chen: [
    '陈志远，西南区最近捷报频传！下周启动的拜访计划准备好了吗？继续保持节奏～ 🌟',
    '陈哥，西南区是团队标杆！8单签约目标还有多少进展？分享一下你的成功经验吧！',
    '陈志远，你是这轮任务里跑得最快的！继续冲，离S级KPI已经很近了！💪',
  ],
};

function toggleAutoUrge() {
  if (isUrgeRunning) {
    stopAutoUrge();
  } else {
    startAutoUrge();
  }
}

function startAutoUrge() {
  // 获取配置的催工间隔
  const intervalInput = document.getElementById('urge-interval');
  if (intervalInput) {
    urgeIntervalSeconds = parseInt(intervalInput.value) || 30;
  }
  
  isUrgeRunning = true;
  urgeSecondsLeft = urgeIntervalSeconds;
  
  document.getElementById('urge-status-tag').className = 'tag tag-green';
  document.getElementById('urge-status-tag').textContent = '运行中';
  document.getElementById('urge-toggle-btn').textContent = '⏹ 停止催工';
  document.getElementById('urge-toggle-btn').className = 'btn btn-sm btn-outline';
  document.getElementById('auto-urge-row').style.background = '#f0fdf6';
  document.getElementById('auto-urge-row').style.borderColor = 'var(--wx-green)';
  
  // 更新定时任务列表中的显示
  const intervalDisplay = document.getElementById('urge-interval-display');
  const intervalTag = document.getElementById('urge-interval-tag');
  if (intervalDisplay) {
    intervalDisplay.textContent = `每${urgeIntervalSeconds}秒`;
  }
  if (intervalTag) {
    intervalTag.textContent = `每${urgeIntervalSeconds}秒推送`;
  }

  showToast(`🔔 自动催工任务已启动！每${urgeIntervalSeconds}秒向员工询问进度`, 'success', '⏰');
  addLog(`⏰ 自动催工任务已启动（间隔${urgeIntervalSeconds}秒）`, 'green');

  // 立刻执行第一次催工
  runUrgeRound();

  // 倒计时显示
  urgeCountdownTimer = setInterval(() => {
    urgeSecondsLeft--;
    const cdEl = document.getElementById('urge-countdown');
    if (cdEl) cdEl.textContent = `倒计时：${urgeSecondsLeft}秒`;
    if (urgeSecondsLeft <= 0) urgeSecondsLeft = urgeIntervalSeconds;
  }, 1000);

  // 按配置间隔触发催工
  autoUrgeTimer = setInterval(() => {
    urgeSecondsLeft = urgeIntervalSeconds;
    runUrgeRound();
  }, urgeIntervalSeconds * 1000);
}

function stopAutoUrge() {
  isUrgeRunning = false;
  clearInterval(autoUrgeTimer);
  clearInterval(urgeCountdownTimer);
  autoUrgeTimer = null;
  urgeCountdownTimer = null;
  document.getElementById('urge-status-tag').className = 'tag tag-gray';
  document.getElementById('urge-status-tag').textContent = '已停止';
  document.getElementById('urge-toggle-btn').textContent = '▶ 启动催工';
  document.getElementById('urge-toggle-btn').className = 'btn btn-sm btn-orange';
  document.getElementById('auto-urge-row').style.background = '#fff8f0';
  document.getElementById('auto-urge-row').style.borderColor = 'var(--wx-orange)';
  document.getElementById('urge-countdown').textContent = '倒计时：--';
  showToast('自动催工任务已停止', 'info', '⏹');
  addLog('⏹ 自动催工任务已手动停止', 'blue');
}

function runUrgeRound() {
  urgeRound++;
  const roundIdx = (urgeRound - 1) % urgeMessages.length;
  const msgPool = urgeMessages[roundIdx];
  const timeStr = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});

  // 推送日志
  addLog(`🔔 第${urgeRound}轮催工推送 — 向4名员工发送进度询问`, 'green');
  showToast(`第${urgeRound}轮催工：正在向所有员工发送进度询问...`, 'info', '🔔');

  // 向 agent 会话推送一条群发催工消息
  const generalMsg = msgPool[Math.floor(Math.random() * msgPool.length)];
  chatData['agent'].messages.push({
    from: 'bot', time: timeStr,
    text: `📡 【第${urgeRound}轮自动催工】\n${generalMsg}`
  });
  // 如果当前在 agent 会话，实时刷新
  if (currentChat === 'agent') renderMessages('agent');
  recordMsg('bot', 'agent');

  // 向各员工会话分别推送个性化催工
  const empKeys = ['zhang','li','wang','chen'];
  empKeys.forEach((key, idx) => {
    setTimeout(() => {
      const pool = personalUrge[key];
      const msg = pool[(urgeRound - 1) % pool.length];
      const t = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
      chatData[key].messages.push({ from: 'bot', time: t, text: `⏰ 【自动催工·第${urgeRound}轮】\n${msg}` });
      if (currentChat === key) renderMessages(key);
      recordMsg('bot', key);

      // 显示侧边栏未读红点
      const badge = document.getElementById('badge-' + key);
      if (badge && currentChat !== key) {
        badge.style.display = 'inline';
        badge.textContent = parseInt(badge.textContent || 0) + 1;
      }
      // 更新侧边栏预览
      const preview = document.querySelector(`#chatitem-${key} .chat-preview`);
      if (preview) preview.textContent = `⏰ 自动催工·第${urgeRound}轮`;
    }, idx * 600); // 每隔600ms错峰发送
  });

  // 注意：不再模拟员工自动回复
  // 所有人类员工角色只能由用户手动输入文字发消息
  // 智能体根据人类员工的消息语句来做出响应
  
  showToast(`第${urgeRound}轮催工消息已发送至所有员工会话`, 'info', '🔔');
}


// ===================================================
// 🤖 大模型 AI 接入层（智谱 GLM-4-Flash）
// ===================================================

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// ─── AI 配置状态 ───────────────────────────────────
const aiCfg = {
  key:    localStorage.getItem('glm_api_key')    || '',
  model:  localStorage.getItem('glm_model')      || 'glm-4-flash',
  prompt: localStorage.getItem('glm_sys_prompt') || '你是一名企业微信智能体员工助手，服务于一家医疗设备销售公司的销售团队。你既能帮助管理销售任务、询问进度、提供情绪支持，也能进行日常聊天、回答知识问题。回答简洁友好，符合职场氛围，适当使用emoji增加亲切感。',
  get enabled() { return !!this.key; }
};

// 各会话的多轮对话历史
const aiHistory = { agent:[], zhang:[], li:[], wang:[], chen:[], boss:[] };

// ─── 弹窗控制 ──────────────────────────────────────
function openAIConfig() {
  const modal = document.getElementById('ai-config-modal');
  modal.style.display = 'block';
  document.getElementById('ai-key-input').value    = aiCfg.key;
  document.getElementById('ai-model-select').value = aiCfg.model;
  document.getElementById('ai-system-prompt').value= aiCfg.prompt;
  document.getElementById('ai-connect-result').style.display = 'none';
}
function closeAIConfig() {
  document.getElementById('ai-config-modal').style.display = 'none';
}
function toggleKeyVisible() {
  const inp = document.getElementById('ai-key-input');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── 保存配置 ──────────────────────────────────────
function saveAIConfig() {
  const key    = document.getElementById('ai-key-input').value.trim();
  const model  = document.getElementById('ai-model-select').value;
  const prompt = document.getElementById('ai-system-prompt').value.trim();
  if (!key) { showConnectResult('⚠️ 请填写 API Key', 'warn'); return; }
  aiCfg.key    = key;
  aiCfg.model  = model;
  aiCfg.prompt = prompt;
  localStorage.setItem('glm_api_key',    key);
  localStorage.setItem('glm_model',      model);
  localStorage.setItem('glm_sys_prompt', prompt);
  updateAIStatusUI(true);
  showConnectResult('✅ 配置已保存！AI 已启用，开始智能对话吧~', 'ok');
  showToast('🧠 大模型 AI 已连接：' + model, 'success', '🤖');
  setTimeout(closeAIConfig, 1400);
}

function clearAIConfig() {
  aiCfg.key = ''; aiCfg.model = 'glm-4-flash';
  ['glm_api_key','glm_model','glm_sys_prompt'].forEach(k => localStorage.removeItem(k));
  document.getElementById('ai-key-input').value = '';
  updateAIStatusUI(false);
  showConnectResult('已清除 API Key，切回规则回复模式', 'warn');
}

function showConnectResult(msg, type) {
  const el = document.getElementById('ai-connect-result');
  el.style.display    = 'block';
  el.style.background = type==='ok'?'#f0fdf6':type==='warn'?'#fff8f0':'#fff0f0';
  el.style.color      = type==='ok'?'#065f46':type==='warn'?'#92400e':'#991b1b';
  el.style.border     = '1px solid '+(type==='ok'?'#d1fae5':type==='warn'?'#fed7aa':'#fecaca');
  el.textContent = msg;
}

// ─── 测试连接 ──────────────────────────────────────
async function testAIConnection() {
  const key   = document.getElementById('ai-key-input').value.trim();
  const model = document.getElementById('ai-model-select').value;
  if (!key) { showConnectResult('⚠️ 请先填写 API Key', 'warn'); return; }
  showConnectResult('⏳ 正在连接，请稍候...', 'warn');
  try {
    const reply = await callGLM([{ role:'user', content:'你好，请用一句话介绍你自己。' }], key, model);
    showConnectResult('✅ 连接成功！AI 回复：' + reply, 'ok');
  } catch(e) {
    showConnectResult('❌ 连接失败：' + e.message, 'err');
  }
}

// ─── 全局 AI 状态 UI 更新 ──────────────────────────
function updateAIStatusUI(connected) {
  const dot  = document.getElementById('ai-status-dot');
  const text = document.getElementById('ai-status-text');
  if (dot)  { dot.style.background  = connected ? '#07C160' : '#666'; dot.style.animation = connected ? 'pulse 1.5s infinite' : 'none'; }
  if (text) { text.style.color = connected ? '#07C160' : '#aaa'; text.textContent = connected ? ('AI · ' + aiCfg.model) : 'AI未连接'; }
  const chatDot   = document.getElementById('chat-ai-dot');
  const chatLabel = document.getElementById('chat-ai-label');
  const chatBtn   = document.getElementById('chat-ai-btn');
  if (chatDot)   chatDot.style.background = connected ? '#07C160' : '#ccc';
  if (chatLabel) { chatLabel.style.color = connected ? '#07C160' : '#bbb'; chatLabel.textContent = connected ? ('🧠 AI 智能回复 · ' + aiCfg.model) : '规则回复模式（未连接AI）'; }
  if (chatBtn)   chatBtn.textContent = connected ? '🔄 切换配置' : '⚙️ 配置AI';
}

// ─── 核心：调用 GLM REST API ───────────────────────
async function callGLM(messages, key, model) {
  key   = key   || aiCfg.key;
  model = model || aiCfg.model;
  const resp = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
    body: JSON.stringify({ model, messages, temperature:0.85, max_tokens:600, stream:false })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('HTTP ' + resp.status + ': ' + err.slice(0,120));
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '（无回复）';
}




// ─── 打字机动画气泡 ────────────────────────────────
function showTypingBubble(chatKey) {
  if (currentChat !== chatKey) return;
  const container = document.getElementById('chat-messages');
  const data = chatData[chatKey];
  const row = document.createElement('div');
  row.className = 'msg-row';
  row.id = 'typing-indicator';
  // 打字动画总是智能体在输入，使用智能体头像
  row.innerHTML = `
    <div class="msg-avatar" style="background:${agentConfig.avatarBg}">${agentConfig.avatarText}</div>
    <div><div class="msg-bubble" style="background:#fff;border-radius:0 10px 10px 10px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
      <span style="display:inline-flex;gap:4px;align-items:center;height:18px">
        <span style="width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot 1.2s infinite 0s"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot 1.2s infinite .2s"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot 1.2s infinite .4s"></span>
      </span>
    </div></div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}
function removeTypingBubble() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}
// 注入打字动画CSS
!document.getElementById('tdot-style') && (()=>{const s=document.createElement('style');s.id='tdot-style';s.textContent='@keyframes tdot{0%,80%,100%{transform:scale(.5);opacity:.3}40%{transform:scale(1);opacity:1}}';document.head.appendChild(s);})();

// ─── 统一入口：优先 AI，失败降级规则 ──────────────
async function sendMsgWithAI(userText, chatKey) {
  if (!aiCfg.enabled) {
    return generateSmartReply(userText, chatKey);
  }
  showTypingBubble(chatKey);
  try {
    const reply = await callGLMWithContext(userText, chatKey);
    removeTypingBubble();
    return reply;
  } catch(e) {
    removeTypingBubble();
    console.warn('GLM fallback:', e.message);
    showToast('AI 接口异常，已切换规则回复', 'warning', '⚠️');
    return generateSmartReply(userText, chatKey);
  }
}

// ─── 页面初始化恢复 AI 状态 ────────────────────────
(function initAIState() {
  if (aiCfg.key) updateAIStatusUI(true);
  // 预填内置 Key（若 localStorage 无记录）
  const builtinKey = '6d9c55533924410ea1dc6f22c08d039d.ct38H2ovcTa2GWHT';
  if (!aiCfg.key && builtinKey) {
    aiCfg.key = builtinKey;
    localStorage.setItem('glm_api_key', builtinKey);
    updateAIStatusUI(true);
    console.log('✅ 已加载内置 GLM API Key');
  }
})();


// ─── 带系统Prompt + 多轮历史调用 ──────────────────
async function callGLMWithContext(userText, chatKey) {
  const ctxMap = {
    zhang:'你正在与销售经理张伟对话，他负责华东区，当前进度65%，进展顺利。',
    li:   '你正在与销售顾问李娜对话，她负责华北区，当前进度40%，正在整理定制方案。',
    wang: '你正在与销售专员王芳对话，她负责华南区，当前进度20%，遇到政府采购困难，需要更多情绪支持和鼓励。',
    chen: '你正在与销售专员陈志远对话，他负责西南区，当前进度85%，执行最快，适当表扬和激励。',
    boss: '你正在与CEO林总对话，他需要整体销售汇报，回答要简洁专业有数据感。',
    agent:'你正在处理销售团队群组消息，需要面向整个销售团队，回答要鼓舞士气、简洁有力。',
  };
  const sysContent = aiCfg.prompt + '\n\n【当前对话背景】' + (ctxMap[chatKey] || '');
  const hist = (aiHistory[chatKey] || []).slice(-10);
  const messages = [{ role:'system', content:sysContent }, ...hist, { role:'user', content:userText }];
  const reply = await callGLM(messages);
  aiHistory[chatKey] = [...(aiHistory[chatKey]||[]), { role:'user', content:userText }, { role:'assistant', content:reply }].slice(-20);
  return reply;
}




setTimeout(() => {
  showToast('智能体已启动，开始监控销售任务', 'success', '🤖');
}, 500);
setTimeout(() => {
  showToast('定时任务：晨报推送已执行（09:00）', 'info', '⏰');
}, 2000);
setTimeout(() => {
  document.querySelectorAll('.tab-btn')[1].click();
  showToast('张伟已回复任务确认消息', 'success', '💬');
  document.getElementById('badge-zhang').style.display = 'inline';
}, 4500);
setTimeout(() => {
  document.querySelectorAll('.tab-btn')[0].click();
}, 4600);
