/* 文字与图形一起呈现；每小段等长，虚线段表示相差或缺口。 */
(function(){
  const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function svg(label,body,height=240){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 '+height+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';}
  function text(x,y,s,extra=''){return '<text x="'+x+'" y="'+y+'" '+extra+'>'+esc(s)+'</text>';}
  function bar(x,y,w,color='#7196c9',dash=false){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="32" rx="4" fill="'+(dash?'#fff9e6':color)+'" stroke="'+(dash?'#94651b':'#365b8c')+'" stroke-width="2" '+(dash?'stroke-dasharray="6 4"':'')+'/>';}
  function groups(values,labels,unit){let body='';const step=496/Math.max(...values);values.forEach((n,i)=>{const y=38+i*105;body+=text(12,y,labels[i]);for(let j=0;j<n;j++)body+=bar(12+j*step,y+14,step-8,i?'#b1a1c8':'#8eafd8');body+=text(12,y+78,n+' 份，每份 '+unit);});return svg(labels.join('与')+'：每小格是一份，'+unit,body,values.length*105+25);}
  const diagrams={
    trays:()=>svg('上排24张，下排18张；每6张一盘，相差6张也就是1盘。',text(12,26,'每格＝一盘＝6张')+[4,3].map((n,i)=>{let b=text(12,76+i*88,i?'阿禾':'阿榆');for(let j=0;j<n;j++)b+=bar(86+j*99,50+i*88,91,i?'#b3a3cd':'#8eafd8')+text(105+j*99,75+i*88,'6');return b+text(86,106+i*88,i?'18张＝3盘':'24张＝4盘');}).join(''),240),
    prices:()=>svg('总价先平均分。4杯16元每杯4元；4张28元每张7元；单价相差3元。',text(12,30,'4杯饮品共16元')+text(12,70,'16 ÷ 4＝4（元／杯）')+text(12,124,'4张卡片共28元')+text(12,164,'28 ÷ 4＝7（元／张）')+text(12,218,'比较一份：7－4＝3（元）'),240),
    compare:()=>svg('蓝箱18张，银箱比蓝箱多5张共23张。右端虚线段是相差的5张。',text(12,42,'蓝箱')+bar(96,17,274)+text(109,42,'18张')+text(12,117,'银箱')+bar(96,92,274)+bar(370,92,76,'',true)+text(109,117,'相同的18张')+text(385,117,'5')+text(12,182,'蓝箱比银箱少5张')+text(12,222,'⇅ 银箱比蓝箱多5张'),245),
    times:()=>groups([1,3],['小袋','三倍袋'],'6张'),
    extra:()=>svg('小袋6张，多3张袋由相同的6张和额外3张组成，共9张，不是3倍。',text(12,40,'小袋')+bar(12,56,216)+text(88,80,'6张')+text(12,130,'多3张袋')+bar(12,146,216)+bar(228,146,108,'',true)+text(88,170,'6张')+text(244,170,'3张')+text(12,224,'比小袋多3张：6＋3＝9（张）'),250),
    money:()=>svg('要付30元；还剩4元表示原有34元，还差4元表示只有26元。',text(12,28,'要付：5×6＝30（元）')+text(12,78,'还剩4元：原有的钱更长')+bar(12,91,360)+bar(372,91,48,'',true)+text(110,116,'已付30')+text(381,116,'4')+text(12,172,'还差4元：现有的钱不够')+bar(12,185,312,'#b1a1c8')+bar(324,185,48,'',true)+text(110,210,'现有26')+text(333,210,'4'),240),
    share:()=>svg('24枚夹子留6枚，剩18枚平均分给3组，每组6枚。',text(12,30,'24枚，先留6枚 → 剩18枚')+[0,1,2].map(i=>bar(12+i*165,54,153)+text(34+i*165,78,'第'+(i+1)+'组')).join('')+[0,1,2].map(i=>text(50+i*165,126,'6枚')).join('')+text(12,184,'18 ÷ 3＝6（枚）')+text(12,228,'先找“分什么”，再找“分几份”。'),250),
    rain:()=>svg('先合成30毫米，再按10毫米一厘米换成3厘米。',text(12,40,'14毫米＋16毫米＝30毫米')+text(12,100,'10毫米　10毫米　10毫米')+[0,1,2].map(i=>bar(12+i*162,115,153)).join('')+text(12,200,'每格1厘米，共3厘米'),225),
    lesson1:()=>svg('每格是一盘，5张一盘，35张7盘、20张4盘，相差3盘。',text(12,30,'每格5张；比较“几盘”')+[7,4].map((n,i)=>{let b=text(12,80+i*78,i?'20张':'35张');for(let j=0;j<n;j++)b+=bar(104+j*56,55+i*78,50);return b;}).join('')+text(12,236,'35÷5－20÷5＝7－4＝3（盘）'),260),
    lesson2:()=>svg('杏树12棵，梨树比杏树少4棵，梨树8棵；杏树等于梨树加相差4棵。',text(12,40,'杏树')+bar(108,15,240)+bar(348,15,120,'',true)+text(175,40,'同样多')+text(377,40,'4')+text(12,116,'梨树')+bar(108,91,240,'#b1a1c8')+text(175,116,'8棵')+text(12,188,'梨树比杏树少 ⇄ 杏树比梨树多')+text(12,232,'求梨树：12－4；求杏树：8＋4'),260),
    lesson3:()=>groups([1,2],['一份','两倍'],'5枚'),
    lesson4:()=>svg('需要24元；还剩3元则原有27元，还差3元则现有21元。',text(12,35,'同样需要24元，比较手里的钱')+text(12,87,'还剩：24＋3＝27（元）')+bar(12,104,336)+bar(348,104,42,'',true)+text(12,179,'还差：24－3＝21（元）')+bar(12,196,294,'#b1a1c8')+bar(306,196,42,'',true),245),
    lesson5:()=>svg('共有20支笔，平均分给4人，每人5支。每人格子等长表示同样多。',text(12,34,'20支笔，平均分成4份')+[0,1,2,3].map(i=>bar(12+i*124,60,115)+text(25+i*124,85,'第'+(i+1)+'人')).join('')+text(12,145,'20 ÷ 4＝5（支）')+text(12,200,'“每人”还要搭配“平均分”。'),225),
    q7:()=>groups([1,3],['小队','大队'],'6面旗'),
    q8:()=>svg('小队6面旗，大队比小队多3面。大队是6面加3面。',text(12,38,'小队')+bar(110,13,240)+text(200,38,'6面')+text(12,120,'大队')+bar(110,95,240)+bar(350,95,120,'',true)+text(200,120,'6面')+text(382,120,'3面')+text(12,195,'共同部分＋多出来的部分'),225),
    q9:()=>svg('小盒4枚，大盒是小盒的2倍还多3枚。大盒两段各4枚，再加一段3枚。',text(12,40,'小盒')+bar(108,15,128)+text(150,40,'4枚')+text(12,126,'大盒')+bar(108,101,128)+bar(236,101,128)+bar(364,101,96,'',true)+text(150,126,'4')+text(280,126,'4')+text(402,126,'3')+text(12,200,'两个同样的整份，再加额外部分'),225)
  };
  document.querySelectorAll('[data-diagram]').forEach(el=>{const draw=diagrams[el.dataset.diagram];if(draw)el.innerHTML=draw();});
  document.querySelectorAll('[data-reveal]').forEach(btn=>{const target=document.getElementById(btn.dataset.reveal);btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(open));target.hidden=!open;});});
})();
