function checkAcademyTimer()
{
  const timerAlert = document.getElementById('academyAlert');
  if(timerAlert == null)
  {
    console.log('doing');
    const url = 'https://igpmanager.com/index.php?action=fetch&d=facility&id=11&csrfName=&csrfToken=';
    fetch(url)
      .then(response => response.json())
      .then(data => {
        try {
          const r = /cdStyle=.+?>(.*?)<\/span/;
          const resetDate = r.exec(data.vars.options)[1];
          injectNotification(resetDate);
        } catch (error) {
          //console.log('academy not found');
          injectNotification(new Date());
        }

      });
  }else{
    const resetDate = document.getElementById('academyAlert').attributes.expire.textContent;
    document.getElementById('academyAlert').childNodes[0].textContent = countDown(resetDate);
  }

}
function injectNotification (resetDate){
  if(document.getElementById('academyAlert') == null)
  {
    const notification = document.createElement('div');
    notification.className = 'notify';
    notification.id = 'academyAlert';
    notification.setAttribute('style','display:flex;background:#5986b3!important;width: fit-content!important;min-width: 24px;');
    notification.setAttribute('expire',resetDate);
    const span = document.createElement('span');
    span.className = 'robotoBold';
    span.textContent = countDown(resetDate);
    notification.append(span);
    try {
      const hq = document.getElementById('mHeadquarters');
      hq.style.position = 'relative';
      hq.append(notification);
    } catch (error) {//error
    }
  }
}
function countDown(resetDate) {
  var countDownDate = new Date(resetDate).getTime();
  var now = new Date().getTime();
  var ms = countDownDate - now;
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  function is0(n,t){if(n == 0)return '';return n + t;}
  let string = `${is0(d,'d')}${is0(h,'h')}${is0(m,'m')}`;
  if (ms < 0)
    string = '!';

  return string;
  //return { d: d, h: h, m: m, s: s };
}
setTimeout(checkAcademyTimer, 500);
