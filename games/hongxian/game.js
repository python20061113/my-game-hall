(()=>{
'use strict';
const A='assets/';
const bg={montage:A+'02_backgrounds/01_historical_background_montage.png',jurentang:A+'02_backgrounds/02_beijing_jurentang.png',hall:A+'02_backgrounds/03_hongxian_enthronement_hall.png',meeting:A+'02_backgrounds/04_beijing_military_conference.png',battle:A+'02_backgrounds/05_southern_sichuan_battlefield.png',square:A+'02_backgrounds/06_zhengyangmen_square.png',hankou:A+'02_backgrounds/07_hankou_forward_headquarters.png',diplomatic:A+'02_backgrounds/08_diplomatic_negotiation_room.png',xian:A+'02_backgrounds/09_xian_city_gate.png',palace:A+'02_backgrounds/10_western_capital_palace.png',map:A+'02_backgrounds/11_republic_of_china_map.png',stage:A+'02_backgrounds/12_curtain_call_stage.png'};
const people={
 '袁世凯':A+'01_characters/01_yuan_shikai_presidential_uniform.png','袁世凯·龙袍':A+'01_characters/02_yuan_shikai_hongxian_robe_normal.png','袁世凯·疲惫':A+'01_characters/03_yuan_shikai_hongxian_robe_tired.png','杨度':A+'01_characters/04_yang_du.png','袁克定':A+'01_characters/05_yuan_keding.png','梁启超':A+'01_characters/06_liang_qichao.png','蔡锷':A+'01_characters/07_cai_e.png','冯国璋':A+'01_characters/08_feng_guozhang.png','段祺瑞':A+'01_characters/09_duan_qirui.png','徐世昌':A+'01_characters/10_xu_shichang.png','芮恩施':A+'01_characters/11_paul_reinsch.png'};
const docs={telegram:A+'05_document_templates/01_blank_telegram.png',newspaper:A+'05_document_templates/02_blank_newspaper.png',government:A+'05_document_templates/03_blank_government_document.png',contract:A+'05_document_templates/04_foreign_loan_contract.png',ballot:A+'05_document_templates/05_national_form_ballot_book.png',petition:A+'05_document_templates/06_mass_petition_book.png'};
const props={officials:A+'03_crowd_silhouettes/01_kneeling_officials_silhouette.png',crowd:A+'03_crowd_silhouettes/02_common_crowd_silhouette.png',soldiers:A+'03_crowd_silhouettes/03_soldier_formation_silhouette.png',five:A+'04_flags/01_five_colored_flag.png',dragon:A+'04_flags/02_hongxian_dragon_flag.png',map:A+'06_props/04_china_military_map.png'};
const $=s=>document.querySelector(s), game=$('#game'), background=$('#background'), chars=$('#characters'), propLayer=$('#prop-layer');
const states=[...document.querySelectorAll('.panel-state')], advance=$('#advance');
let queue=[],index=0,history=[],fontLarge=false,currentEnding='';
let audioCtx=null,musicGain=null,musicTimer=null,musicEnabled=true,voiceEnabled=true,musicStep=0,musicNodes=[];
let voiceManifest=window.HONGXIAN_VOICES||{},currentVoiceAudio=null,voiceRequest=0;
const voiceReady=Promise.resolve(voiceManifest);
const voiceProfiles={'袁世凯':[.76,.9],'袁世凯·龙袍':[.7,.86],'袁世凯·疲惫':[.66,.78],'杨度':[1.02,1.03],'袁克定':[1.12,1.08],'梁启超':[.96,.98],'蔡锷':[.88,.96],'冯国璋':[.8,.91],'段祺瑞':[.84,.94],'徐世昌':[.74,.83],'芮恩施':[.9,.88],'旁白':[.82,.88]};
const N=(text,o={})=>({t:'n',text,...o}),D=(speaker,text,o={})=>({t:'d',speaker,text,...o}),S=(image,date='',tag='',cast=[],prop=null)=>({t:'s',image,date,tag,cast,prop}),Y=year=>({t:'y',year}),DOC=(kind,title,text,kicker='史料')=>({t:'doc',kind,title,text,kicker}),CHOICE=(question,options,go)=>({t:'choice',question,options,go});
const cast=(name,side='left',voice=false)=>({name,side,voice});
function ensureAudio(){
 try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(_){audioCtx=null;}
 if(musicEnabled&&!musicGain)startMusic();
}
function startMusic(){
 if(!musicEnabled)return;ensureAudioContextOnly();if(!audioCtx||musicGain)return;
 musicGain=audioCtx.createGain();musicGain.gain.setValueAtTime(.035,audioCtx.currentTime);musicGain.connect(audioCtx.destination);
 [[98,'sine',.45],[146.83,'triangle',.18]].forEach(([freq,type,level])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=level;o.connect(g).connect(musicGain);o.start();musicNodes.push(o,g)});
 playMusicNote();musicTimer=setInterval(playMusicNote,2600);
}
function ensureAudioContextOnly(){try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(_){audioCtx=null;}}
function playMusicNote(){
 if(!audioCtx||!musicGain||!musicEnabled)return;const scale=[196,220,261.63,293.66,329.63,293.66,261.63,220],freq=scale[musicStep++%scale.length],t=audioCtx.currentTime;
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.24,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);o.connect(g).connect(musicGain);o.start(t);o.stop(t+1.9);
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}musicNodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch(_){}});musicNodes=[];try{musicGain?.disconnect()}catch(_){}musicGain=null;}
function hashVoice(value){let h=0x811c9dc5;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')}
function setMusicLevel(level,seconds=.18){if(!musicGain||!audioCtx)return;musicGain.gain.cancelScheduledValues(audioCtx.currentTime);musicGain.gain.setTargetAtTime(level,audioCtx.currentTime,seconds)}
function stopVoice(){voiceRequest++;if(currentVoiceAudio){currentVoiceAudio.pause();currentVoiceAudio.currentTime=0;currentVoiceAudio=null}setMusicLevel(.035)}
function speakLine(text,speaker='旁白'){
 if(!voiceEnabled||!text)return;stopVoice();const request=voiceRequest,clean=text.replace(/——.*$/,'').trim(),key=hashVoice(`${speaker}|${clean}`);
 const play=()=>{if(request!==voiceRequest||!voiceEnabled)return;const entry=voiceManifest[key];if(!entry){voiceBlip(speaker);return}const audio=new Audio(entry.file);audio.preload='auto';audio.volume=.96;currentVoiceAudio=audio;audio.onplay=()=>setMusicLevel(.012,.08);audio.play().catch(()=>{setMusicLevel(.035);voiceBlip(speaker)});audio.onended=()=>{setMusicLevel(.035);if(currentVoiceAudio===audio)currentVoiceAudio=null};audio.onerror=()=>setMusicLevel(.035)};
 Object.keys(voiceManifest).length?play():voiceReady.then(play);
}
function voiceBlip(speaker){
 ensureAudioContextOnly();if(!audioCtx)return;const profile=voiceProfiles[speaker]||voiceProfiles['旁白'],base=120+profile[0]*90,t=audioCtx.currentTime;for(let i=0;i<3;i++){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=base+i*18;g.gain.setValueAtTime(.018,t+i*.07);g.gain.exponentialRampToValueAtTime(.0001,t+.06+i*.07);o.connect(g).connect(audioCtx.destination);o.start(t+i*.07);o.stop(t+.08+i*.07)}}
function commonStory(){return[
 S(bg.montage,'1911—1915','历史背景'),Y('1911'),N('1911年，辛亥革命爆发。延续两千余年的君主制度，在革命、起义与政治谈判中走向终结。'),Y('1912'),N('1912年，清帝退位，中华民国成立。共和国第一次出现在中国的正式国号之中。'),N('然而，新的制度并没有立即带来稳定。总统、国会、政党、地方军队与各省实力派，都在争夺国家未来的方向。'),N('袁世凯以北洋军为基础，成为民国临时大总统。许多人相信，只有他能够维持这个仍在分裂边缘的国家。'),Y('1913'),N('1913年，政治冲突进一步激化。议会斗争、二次革命和地方军事冲突，使刚刚建立的共和制度迅速陷入危机。'),Y('1914'),N('1914年，国会被解散，总统权力不断扩大。共和国的名义仍然存在，权力却越来越集中于一个人。'),Y('1915'),N('1915年，日本提出二十一条要求。外交压力、财政困难、地方割据和军队忠诚的问题同时压向北京。'),N('就在此时，一种危险而诱人的主张开始出现：既然共和无法结束争斗，为什么不恢复君主制度？'),
 S(bg.jurentang,'1915年8月14日　北京','史实背景',[cast('杨度','left'),cast('袁世凯','right')],props.map),N('北京的夏夜闷热得令人窒息。财政吃紧，地方军队拒绝裁撤，日本仍在扩大影响，国会已经无法发挥原有作用。'),N('共和国仍然存在，却没有多少人相信这套制度真正稳定。'),D('杨度','大总统，今日之中国，不缺制度的名称，缺的是能够结束争夺的权威。'),D('袁世凯','我已经是大总统。军令从北京发出，各省也仍称我一声元首。还要什么权威？'),D('杨度','总统只是职位。今日可以属于您，明日便可以属于另一个人。'),D('袁世凯','所以你们要给我一个不能被选走的位置？'),D('杨度','不是给您，是给这个国家。'),D('袁世凯','这句话听起来漂亮。可天下人会相信吗？'),D('杨度','辛亥以来，人们最怕的不是皇帝，而是混乱。商人怕铁路断绝，士绅怕地方兵变，军人怕军饷不继，列强怕条约无人执行。'),D('杨度','只要帝制能够代表秩序，他们未必真正拥护皇帝，却可能接受皇帝。'),D('袁世凯','接受和效忠，不是一回事。'),D('杨度','天下的制度，最初都只是接受。时间久了，接受便会变成习惯，习惯便会成为正统。'),
 S(bg.jurentang,'1915年8月14日　北京','史实背景',[cast('徐世昌','left'),cast('袁世凯','right')],props.map),D('徐世昌','大总统若不称帝，地方仍会争权；可大总统若称帝，所有争权的人都会突然得到一个共同的理由。'),D('袁世凯','说下去。'),D('徐世昌','共和之下，他们彼此也会争斗。帝制一立，他们便可以暂时把旧怨放在一边，先共同反对北京。'),D('袁世凯','一个说天下需要皇帝，一个说皇帝会替天下制造敌人。'),D('袁世凯','我真正想知道的是：这个国家究竟需要什么？一个无人尊重的制度，还是一个人人畏惧的权威？'),N('几天后，筹安会成立。表面上，这是一场学术讨论；实际上，所有人都知道，皇位已经被摆到了袁世凯面前。'),
 S(bg.jurentang,'1915年10月28日　北京','史实背景',[cast('袁克定','left'),cast('袁世凯','right')]),D('袁克定','父亲，各省国民代表已经完成投票。'),D('袁世凯','结果如何？'),D('袁克定','赞成君主立宪者，一致通过。没有一张反对票。'),N('所有票册都整齐得近乎完美。每一省都拥护帝制，每一名代表都请求袁世凯接受皇位。'),DOC('ballot','国体投票册','各省国民代表一致赞成君主立宪，恭请大总统接受皇位。','国体投票'),
 S(bg.jurentang,'1915年10月28日　北京','史实背景',[cast('杨度','left'),cast('袁世凯','right')]),D('杨度','各省代表共同推戴，大总统已经不能只从个人进退考虑。'),D('袁世凯','不能从个人进退考虑，却要把皇位交给我个人？'),D('杨度','皇帝只是国家权威的承担者。'),D('袁世凯','那为什么承担者必须姓袁？'),
 S(bg.jurentang,'1915年10月28日　北京','史实背景',[cast('袁克定','left'),cast('袁世凯','right')]),D('袁克定','因为天下除了父亲，没有第二个人能够压住各省。'),D('袁世凯','若真没有第二个人，这个王朝在我死后又靠谁压住天下？'),D('袁克定','父亲身体康健，现在考虑这些还太早。'),D('袁世凯','皇位一旦建立，继承问题便不是以后，而是从第一天就开始。'),DOC('newspaper','异哉所谓国体问题者','共和制度尚未成熟，不能成为个人登上皇位的理由。若投票只能出现一种答案，所谓民意，不过是命令穿上了百姓的衣服。','时报·号外'),
 S(bg.jurentang,'1915年10月28日　北京','史实背景',[cast('梁启超','left',true),cast('袁克定','right')]),D('梁启超','共和制度固然尚未成熟，但制度的失败不能成为个人登上皇位的理由。'),D('梁启超','若投票只能出现一种答案，那么所谓民意，不过是命令穿上了百姓的衣服。'),D('袁克定','梁启超不过是一介文人。一篇文章，难道还能抵得过各省一致推戴？'),
 S(bg.jurentang,'1915年10月28日　北京','史实背景',[cast('徐世昌','left'),cast('袁世凯','right')]),D('徐世昌','一篇文章抵不过各省，却可能让各省知道，反对者并非只有自己。'),D('袁世凯','若连一篇文章都容不下，天下又凭什么相信这场投票是真的？'),
 CHOICE('如何处理公开反对帝制的声音？',['立即查封报馆，禁止继续传播','允许公开论战，让帝制派正面回应'],firstChoice)
];}
function firstChoice(n){history.push(n);return n===0?[
 S(bg.square,'1915年11月　北京','史实背景',[cast('梁启超','left',true),cast('徐世昌','right')],props.crowd),N('北京的报馆很快安静下来。文章原版被查禁，但抄本通过天津、上海、日本和租界报纸继续传播。'),D('梁启超','当一种意见必须依靠警察才能获胜，人们便已经知道它害怕什么。'),D('徐世昌','真正危险的不是街上的声音，而是所有人都不再愿意在您面前说真话。'),...afterFirst()]:[
 S(bg.square,'1915年11月　北京','史实背景',[cast('杨度','left'),cast('徐世昌','right')],props.crowd),N('帝制派文章迅速占据北京报纸。杨度等人从秩序、宪法和国家统一的角度为君主制辩护。'),D('杨度','至少现在，天下可以看见帝制并非只靠命令。'),D('徐世昌','天下也第一次看见，反对帝制可以成为一种公开的政治立场。'),N('袁世凯望着堆满书房的报纸：“我们或许赢了北京的版面，却不知道谁赢了看报的人。”'),...afterFirst()];}
function afterFirst(){return[
 S(bg.hall,'1915年12月12日　北京','史实节点',[cast('杨度','left'),cast('袁世凯·龙袍','right')],props.officials),N('在持续数月的劝进、请愿和国体投票之后，袁世凯接受帝位。中华民国仍出现在部分公文之中，一个新的帝国却已开始准备年号、礼服、国旗和官制。'),D('杨度','自今日起，国家权力归于一统。所有关于国体的争论，都应当结束。'),D('袁世凯·龙袍','争论不会因为朕穿上龙袍便结束。'),
 S(bg.hall,'1915年12月12日　北京','史实节点',[cast('袁克定','left'),cast('袁世凯·龙袍','right')],props.officials),D('袁克定','从今日起，反对者面对的不再是一项计划，而是已经建立的制度。'),D('袁世凯·龙袍','制度若必须依靠所有人闭嘴才能存在，它便还没有真正建立。'),D('袁克定','臣等恭请陛下登极。'),D('袁世凯·龙袍','诸君既然把朕推到这里，便要和朕共同承担这个天下。'),N('“万岁！万岁！万万岁！”礼炮与钟声中，洪宪龙旗升起。大殿边缘，几名北洋将领没有跪下，只是低头沉默。'),
 DOC('telegram','云南急电','云南宣布独立。蔡锷、唐继尧等以维护共和、反对帝制为号召，组织护国军讨袁。','1915年12月25日'),
 S(bg.hall,'1915年12月25日　北京','史实节点',[cast('蔡锷','left',true),cast('袁克定','right')]),N('接受帝位十三天后，云南宣布独立。'),D('蔡锷','帝制一日不除，护国军一日不停。'),D('袁克定','云南一省，兵少粮缺。只要北洋军迅速南下，第一场战斗便能决定天下态度。'),
 S(bg.meeting,'1915年12月25日　北京','史实节点',[cast('段祺瑞','left'),cast('袁世凯·龙袍','right')],props.map),D('段祺瑞','北洋军的确强于护国军。可军队强弱是一回事，军队愿意为什么而战，是另一回事。'),D('袁世凯·龙袍','他们都是我一手带出来的北洋军。'),D('段祺瑞','所以他们愿意服从大总统。可陛下现在要求他们保卫的，是一个准备传给袁家子孙的王朝。'),D('段祺瑞','军队不是家臣。前线每死一个人，将领都要重新计算，这顶皇冠究竟值不值得继续打。'),
 S(bg.meeting,'1915年12月25日　北京','史实节点',[cast('冯国璋','left'),cast('袁世凯·龙袍','right')],props.map),D('冯国璋','云南敢先动，是因为他们相信其他省份正在观望。'),D('袁世凯·龙袍','观望什么？'),D('冯国璋','观望北京能不能迅速取胜，也观望谁先反对帝制可以得到更多条件。'),D('袁世凯·龙袍','朕若退，帝制立即成为笑话。朕若战，便要让天下相信，这场战争是为了国家，而不是为了袁家。'),D('冯国璋','可这两个理由，已经很难分开了。'),
 CHOICE('云南起兵后，首先采取什么行动？',['立即出兵，先用胜利压住全国','如期登极，以既成事实稳住人心','寻求列强支持，先解决军费与承认'],secondChoice)
];}
function secondChoice(n){history.push(n);return [militaryBranch,ceremonyBranch,diplomaticBranch][n]();}
function militaryBranch(){return[
 S(bg.meeting,'1916年1月7日　北京','架空推演',[cast('段祺瑞','left'),cast('袁世凯·龙袍','right')],props.map),D('段祺瑞','第一批北洋军已经进入四川。但军饷只能维持六周，川南运力不足，部分将领还在拖延出发。'),D('袁世凯·龙袍','他们是在等第一场战斗的结果。若胜，便争着领功；若败，便拿军队和我谈条件。'),
 S(bg.meeting,'1916年1月7日　北京','架空推演',[cast('袁克定','left'),cast('冯国璋','right')],props.map),D('袁克定','那就杀一个最会等待的人，让剩下的人知道皇帝不是大总统。'),D('冯国璋','也会让他们知道，皇帝比大总统更容易杀自己人。'),N('袁世凯明白：若只靠旧情，他们不会动；若只靠军法，他们会动，却未必会真打。'),
 CHOICE('如何迫使北洋军迅速出征？',['公开处决抗命军官，以军法震慑全军','悬赏十万大洋，最先破敌者封一等公','允许各军自行筹饷，并承认其地方控制权'],militaryThird)
];}
function militaryThird(n){history.push(n);const feedback=[
 [N('一名迟延出发的旅长被公开处决。四十八小时内，三支北洋军登车南下。'),D('段祺瑞','军令恢复了。'),D('冯国璋','恐惧也恢复了。今日他们怕陛下，明日便会先想办法让陛下失去杀人的能力。')],
 [N('重赏传到前线，各部争相抢夺进军路线。推进速度提高，也开始争抢军粮、虚报伤亡、保留预备队。'),D('袁世凯·龙袍','只要能赢，账可以以后再算。'),D('冯国璋','每个人都是这样想的。所以他们都把自己的兵留到最后。')],
 [N('各军被允许自行征收部分税款。军饷问题短暂缓解，地方部队迅速集结。'),D('段祺瑞','军队有钱了。'),D('冯国璋','可这笔钱不再经过北京。等仗打完，他们或许已经不需要北京了。')]
 ][n];return [...feedback,...militaryAfter()];}
function militaryAfter(){return[
 S(bg.battle,'1916年1月29日　川南','架空推演',[cast('蔡锷','left')],props.soldiers),N('北洋军凭借兵力、火炮和补给优势，在泸州外围突破护国军两道阵地。护国军伤亡惨重，被迫向山地撤退。'),D('蔡锷','保存主力，向后撤。让他们宣传胜利。'),D('蔡锷','只要帝制还在，北京每前进一步，就要多付一日军饷；我们每多守一天，就会多一个省重新计算自己的立场。'),
 S(bg.square,'1916年2月　北京','架空推演',[cast('袁克定','left'),cast('袁世凯·龙袍','right')],props.crowd),N('捷报传回北京。灯笼亮起，报童挥舞捷报，帝制支持者宣称云南叛乱即将平定。'),D('袁克定','父亲，我早说过，天下只看胜负。正因前线未完，才需要一场大典告诉天下，胜利属于谁。'),
 S(bg.meeting,'1916年2月　北京','架空推演',[cast('段祺瑞','left'),cast('冯国璋','right')],props.map),D('段祺瑞','陛下，前线请求补充三个月军饷。国库没有这么多现银，各省正在拖延，列强也在观望。'),D('冯国璋','陛下赢了一场战斗，却必须用整个北洋体系去支付下一场战斗。'),
 S(bg.hankou,'1916年2月18日　汉口','架空推演',[cast('段祺瑞','left'),cast('袁世凯·龙袍','right')],props.soldiers),N('为了迫使各军继续推进，袁世凯离开北京，在汉口设立御驾行营。'),D('袁世凯·龙袍','朕已经到了前线。现在还有谁敢说，这只是袁家让别人送死？'),D('段祺瑞','陛下亲临确实提振了军心，也让所有人看见，北京已经无法单靠一道电报指挥战争。'),DOC('telegram','前线急电','广西态度动摇，贵州拒绝继续提供军粮。北京北洋元老要求暂缓进攻。','汉口行营'),
 CHOICE('最后一击，应该押上什么？',['抽空京畿禁卫军，发动三路总攻','扣押观望将领家属，逼迫各军参战','停止追击，举行全国登极朝贺重建威信','放弃北京，将行营迁往西安继续帝业'],n=>finishChoice(n<2?'iron':n===2?'paper':'xian',n))
];}
function ceremonyBranch(){return[
 S(bg.hall,'1916年1月1日　北京','架空推演',[cast('杨度','left'),cast('袁世凯·龙袍','right')],props.officials),D('杨度','云南希望证明帝制不得人心。我们便要让天下亲眼看见，拥护帝制的人比反对者更多。'),D('袁世凯·龙袍','投票已经做过，劝进书也已经堆满居仁堂。'),D('杨度','文字不够。天下需要亲眼看见陛下祭天、受玺、接受万民朝贺。'),
 S(bg.hall,'1916年1月1日　北京','架空推演',[cast('袁克定','left'),cast('徐世昌','right')],props.officials),D('徐世昌','仪式可以让支持者更加坚定，也会迫使中间派公开选边。若他们不愿跪呢？'),D('袁克定','官员有官位，商人有执照，学生有学校，军人有军饷。总能找到让他们来的办法。'),D('徐世昌','用这种办法请来的人，跪得越整齐，越说明他们为什么跪。'),D('梁启超','仪式能制造事实，却不能制造同意。跪下的人未必拥戴，站着的人也未必敢说话。'),
 CHOICE('登极大典要向天下作出什么承诺？',['十年内制定宪法，皇帝主动限制权力','大赦天下，但反对帝制者不在赦免之列','各省保留部分自治，以换取共同拥戴'],ceremonyThird)
];}
function ceremonyThird(n){history.push(n);const f=[
 [N('登极诏书承诺十年内制定宪法、恢复议会并限制皇权。部分温和士绅开始动摇。'),D('徐世昌','承诺换来了一些等待。可十年后的宪法，解决不了十天后的军饷。')],
 [N('普通犯人获得释放，大批政治犯却因“谋叛国体”继续被关押。'),D('徐世昌','反对者会记得，大赦的第一件事，是解释哪些人不配被赦免。安静不等于接受。')],
 [N('部分省份接受中央条件，表示可以暂时不反对帝制。'),D('徐世昌','他们不是接受帝制，是发现反对帝制可以换来更大的自治权。每一次让步都会告诉下一个省份，反对的价格还可以更高。')]
 ][n];return [...f,...ceremonyAfter()];}
function ceremonyAfter(){return[
 S(bg.square,'1916年1月　北京','架空推演',[cast('袁克定','left'),cast('袁世凯·龙袍','right')],props.crowd),N('洪宪年号开始出现在官署、军营、学校与报纸之中。北京街头悬挂龙旗，学校被要求举行新礼，商号收到参加朝贺的通知。'),D('袁克定','各省官署已经开始使用洪宪元年。天下已经承认新朝。'),D('袁世凯·龙袍','命令能让日期改变，不能让银元增加。'),N('自愿报名者不足两万。袁克定要用军人、学生和商号补齐十万人的场面，外国记者的摄影机已经架好。'),
 S(bg.jurentang,'1916年1月　北京','架空推演',[cast('徐世昌','left'),cast('袁世凯·龙袍','right')]),D('袁世凯·龙袍','所有人都说天下拥戴朕。'),D('徐世昌','陛下相信吗？'),D('袁世凯·龙袍','我若完全不信，就不会走到今天。我只需要他们相信，别人都已经拥戴。'),D('徐世昌','可一旦有人第一个站起来，其他人也会突然发现，原来所有人都在等别人先站。'),
 CHOICE('明日的全国朝贺应该如何进行？',['征调军人和学生，必须凑足十万人','允许自由参加，也允许反对者在外围请愿','取消朝贺，命北洋军立即镇压拒绝改元的省份','将大典迁往西安，在新都完成真正登极'],n=>finishChoice(n<2?'paper':n===2?'iron':'xian',n))
];}
function diplomaticBranch(){return[
 S(bg.diplomatic,'1916年1月5日　北京','架空推演',[cast('芮恩施','left'),cast('袁世凯·龙袍','right')]),D('芮恩施','各国已经注意到云南局势。控制地图上的省份，和能够稳定执行合同，并不完全相同。'),D('袁世凯·龙袍','中华帝国会继续承认民国时期签订的条约和债务。这是否足以换来承认？'),D('芮恩施','承认不是道德判断，是风险判断。云南已经独立，其他省份正在观望，您的将领对帝制态度不明。'),D('袁世凯·龙袍','所以各国更应该支持中央。'),D('芮恩施','也可能更应该等待。第一个承认您的国家，会要求第一个价格；第二个会要求相同，甚至更高的价格。'),D('袁世凯·龙袍','国内支持无法从国外购买，可军饷可以买。'),N('财政部估计，现有资金只能维持前线六周。'),
 CHOICE('用什么条件换取紧急贷款？',['以盐税余款作担保，接受外国财政监督','给予铁路和矿业优先权，换取立即放款','拒绝经济让步，要求各国只凭实力承认帝国'],diplomaticThird)
];}
function diplomaticThird(n){history.push(n);const f=[
 [N('贷款迅速到账，前线军饷得到补充。盐税收入却被提前抵押，外国监督人员进入财政机关。'),D('芮恩施','这份合同能够保证三个月军费——如果战争只持续三个月。')],
 [N('外国银行同意提供贷款。作为交换，多条铁路和矿区的优先经营权被写入秘密备忘录。'),D('徐世昌','所有签下秘密条款的人，都说以后可以收回来。')],
 [N('袁世凯拒绝新的经济条件，要求列强根据北京政府的实际控制范围承认帝国。'),D('芮恩施','强硬可以减少一个问题，也可能增加另一个问题。没有额外利益，各国没有理由率先承担承认帝国的风险。')]
 ][n];return [...f,...diplomaticAfter()];}
function diplomaticAfter(){return[
 DOC('newspaper','秘密备忘录见报','借款、铁路与矿业权益的秘密条款震动上海。文件真假混杂，但北京确实进行过秘密谈判。','1916年1月26日·上海'),
 S(bg.diplomatic,'1916年1月26日　北京','架空推演',[cast('梁启超','left',true),cast('袁克定','right')]),D('梁启超','帝制原本只是国体之争。如今，它已经成为主权之争。'),D('袁克定','立即查封报馆，宣布文件是伪造的。'),D('袁世凯·龙袍','第一次否认若被揭穿，第二次说真话也不会有人相信。'),
 S(bg.diplomatic,'1916年1月26日　北京','架空推演',[cast('芮恩施','left'),cast('徐世昌','right')]),D('芮恩施','如果中国给予一项长期租借权，某国愿意率先正式承认中华帝国，并推动新的联合贷款。'),D('徐世昌','只要第一个国家承认，其他国家也会跟着提出自己的条件。'),D('芮恩施','他们是在等待谁最有能力保证自己的利益。'),
 S(bg.diplomatic,'1916年1月26日　北京','架空推演',[cast('徐世昌','left'),cast('袁世凯·龙袍','right')]),D('袁世凯·龙袍','没有承认，天下会说洪宪只是北京自己的皇帝；有了承认，天下会说朕拿国家换皇位。'),D('徐世昌','因为两个说法都不是全错。有些代价付出去，只能换来下一张账单。'),
 CHOICE('是否接受最后的承认条件？',['签署租借协议，换取正式承认和贷款','拒绝协议，公开全部文件挽回国内声望','停止外交谈判，在北京举行盛大登极朝贺','带着贷款与直属军队迁往西安重建朝廷'],n=>finishChoice(n<2?'gold':n===2?'paper':'xian',n))
];}
function finishChoice(kind,n){history.push(n);return endings[kind]();}
const endings={
 iron:()=>[
 S(bg.hankou,'1916年3月9日　汉口','架空结局',[cast('段祺瑞','left'),cast('袁世凯·疲惫','right')],props.soldiers),N('北洋军没有在战场上被护国军彻底击败。真正停止战争的，是一封又一封拒绝继续进攻的电报。'),D('段祺瑞','第三师宣布原地休整。第七师也停止行动，继任师长拒绝到任，禁卫军的军列被扣在北京。'),D('袁世凯·疲惫','命令他们立即前进！换掉师长！'),D('段祺瑞','能换的师长已经换完了。再换下去，命令只会从没有部队的司令部发出。'),
 DOC('telegram','北洋各部联名电','各军愿保国家、保军纪、保袁公安全，惟不愿再以同袍性命维持洪宪帝号。','1916年3月9日·汉口'),
 S(bg.hankou,'1916年3月10日　汉口','架空结局',[cast('冯国璋','left'),cast('袁世凯·疲惫','right')],props.soldiers),D('冯国璋','陛下，北洋各部共同要求取消帝制。'),D('袁世凯·疲惫','你们要逼朕退位？北洋是我一手建立。'),D('冯国璋','我们要保住北洋。正因如此，我们不愿让它和洪宪一起沉下去。'),D('袁世凯·疲惫','朕没有输给蔡锷。'),D('冯国璋','是。陛下输给了所有不愿再为这顶皇冠付钱、流血和冒险的人。'),
 S(bg.battle,'1916年3月11日　川南前线','架空结局',[cast('蔡锷','left')],props.soldiers),N('停火消息传到川南。两军士兵从壕沟后探出头来，先交换水和药品，随后才交换阵亡者名单。'),D('蔡锷','告诉各部，不追击停火的北洋军。我们反对的是帝制，不是要把每个穿灰军装的人逼成死敌。'),N('这道命令让北洋将领看见了一条退路：放弃皇冠，不等于放弃自己的一切。'),
 S(bg.hankou,'1916年3月12日　汉口','架空结局',[cast('段祺瑞','left'),cast('冯国璋','right')],props.soldiers),D('段祺瑞','各省承诺恢复民国后承认中央，前线则保留原有军籍。现在只差一个人的签字。'),D('冯国璋','他签下去，仍可以作为结束战争的人离开；不签，北洋会自己选一个能够结束战争的人。'),
 S(bg.hankou,'1916年3月13日　长江行营','架空结局',[cast('袁世凯·疲惫','right')]),N('深夜，袁世凯独自在撤销帝制诏书前坐了很久。窗外没有万岁声，只有伤兵船靠岸时压低的号子。'),D('袁世凯·疲惫','原来朕以为北洋是我的，所以天下也是我的。到头来，他们只是曾经相信我能替他们守住天下。'),N('他拿起笔，划去“朕”，改写“大总统”。第一笔很重，最后一笔却轻得几乎看不见。'),
 S(bg.hankou,'1916年3月14日　汉口码头','架空终幕',[],props.five),N('行营外，士兵取下洪宪龙旗，用它包住阵亡同伴。撤销帝制的电报沿铁路传向各省，停驶多日的军列开始运送伤员回乡。'),N('一名勤务兵把没有举行过正式加冕礼的皇冠装进木箱。船过江心时，袁世凯命人打开箱盖。铁冠落水，没有发出想象中的巨响，只泛起几圈很快消失的波纹。'),{t:'ending',kind:'iron',title:'铁皇冠沉没',text:'你赢得了战斗，却失去了发动战争的联盟。最后保住北洋的，是放弃让北洋殉葬。'}],
 paper:()=>[
 S(bg.jurentang,'1916年3月17日　北京','架空结局',[cast('杨度','left'),cast('袁世凯·疲惫','right')]),N('登极仪式完成了。洪宪年号印在公文上，龙旗挂在官署前，朝贺影像传遍各地。随后，一连串拒绝开始出现。'),N('商会拒绝缴纳新税，学校出现罢课，铁路职员拖延军运，各省重新使用民国纪年。'),D('杨度','所有程序都完成了。至少朝贺影像仍能证明，十万人曾经跪在正阳门前。'),D('袁世凯·疲惫','程序越完整，越说明这件事需要多少人安排。'),DOC('newspaper','朝贺真相','参与者领取铜元的凭条，与摄影机之外的抗议人群，同时登上报纸。','北京·号外'),
 S(bg.square,'1916年3月18日　正阳门','架空结局',[cast('袁克定','left')],props.crowd),N('袁克定命人再次放映朝贺影像，想用银幕上的人海压过街头的沉默。放映到一半，发电机熄火；黑暗里，有人率先喊出“民国万岁”。'),D('袁克定','抓住他！把出口封起来！'),N('灯重新亮起时，广场已经空了一半。剩下的人没有跪，也没有喊口号，只是看着卫兵还能抓走多少人。'),
 S(bg.jurentang,'1916年3月19日　居仁堂','架空结局',[cast('杨度','left'),cast('袁世凯·疲惫','right')]),D('杨度','还可以重选国民代表，再做一次真正公开的投票。'),D('袁世凯·疲惫','若这一次允许反对，洪宪会输；若仍不允许反对，赢了又有什么用？'),D('杨度','臣原以为制度能够创造信仰。'),D('袁世凯·疲惫','制度可以让人服从，却不能替人相信。我们把服从拍成了电影，便以为也拍到了人心。'),
 S(bg.jurentang,'1916年3月20日　北京','架空结局',[cast('梁启超','left',true),cast('袁世凯·疲惫','right')]),D('梁启超','被迫跪下的人不会因此成为臣民。被禁止说话的人，也不会因此变成赞成者。'),N('各省公文重新印上“中华民国五年”。印刷铺把洪宪纪年纸裁成账簿，学生用龙旗背面抄写新的宣言。'),D('袁世凯·疲惫','朕可以命令他们使用洪宪年号，可以命令他们悬挂龙旗，却不能命令他们相信。'),
 S(bg.hall,'1916年3月21日　登极大殿','架空终幕',[cast('袁世凯·疲惫','right')],props.officials),N('袁世凯下令烧毁登极影像。胶片、请愿书与投票册在铜盆里卷曲，银幕上最后一个跪拜的人化成一块白斑。'),D('袁世凯·疲惫','别再剪接了。把摄影机转向殿外，让后人看看散场以后还剩下什么。'),N('镜头第一次越过宫门：仪仗已经撤走，领过铜元的百姓排队退还租来的礼服。风把一张“万民拥戴”的传单吹过空旷广场，没有人弯腰去捡。'),{t:'ending',kind:'paper',title:'纸做的天命',text:'你制造了最整齐的拥戴，也完成了最彻底的政治揭穿。纸上的一致，最终败给了无人继续表演。'}],
 gold:()=>[
 S(bg.diplomatic,'1916年3月21日　北京','架空结局',[cast('芮恩施','left'),cast('袁世凯·疲惫','right')]),N('洪宪帝国得到了第一份正式承认。二十四小时内，更多省份以“反帝制、保主权”为共同口号宣布反对北京。'),D('芮恩施','银行已经停止新的放款。协议要求中国政府保持稳定，各国已经开始与可能取代您的政府讨论旧债问题。'),D('袁世凯·疲惫','昨天你们还在考虑是否承认朕。今天呢？'),D('芮恩施','今天，各国认为下一届政府更可能保证合同。承认从来不是忠诚。'),
 DOC('contract','正式承认附约','以铁路、矿权与租借地收益担保新借款；如政权更迭，债务及特许权仍由继承政府承担。','外交密约·附件七'),
 S(bg.diplomatic,'1916年3月22日　北京','架空结局',[cast('徐世昌','left'),cast('袁世凯·疲惫','right')]),D('徐世昌','上海商会宣布拒认密约，广东、广西因此联合通电。连原本观望的人，也找到了最容易号召民众的理由。'),D('袁世凯·疲惫','朕拿承认换稳定，他们却说朕拿国家换皇位。'),D('徐世昌','因为协议保住的是债权，不是陛下。列强要一个会还钱的政府，未必要这个政府姓袁。'),
 S(bg.map,'1916年3月23日　全国','架空结局',[],props.map),N('铁路工人拒绝运送执行租借协议的外国勘测队。矿区商团扣住北京派来的接收官。沿江各省把“反帝制”与“收回利权”写在同一面旗上。'),N('原本分散的反对力量，因为一份外国合同第一次拥有了共同语言。皇冠没有换来国际安全，反而替国内战争加上了民族动员。'),
 S(bg.diplomatic,'1916年3月24日　北京','架空结局',[cast('芮恩施','left'),cast('袁世凯·疲惫','right')]),D('袁世凯·疲惫','如果朕撤销帝制，承认还有效吗？'),D('芮恩施','对帝国的承认会结束，但合同对中国的效力不会结束。'),D('袁世凯·疲惫','原来皇位可以撤销，签出去的国家不能。'),D('芮恩施','这正是所有谈判方从一开始就明白的区别。'),
 S(bg.jurentang,'1916年3月25日　居仁堂','架空结局',[cast('徐世昌','left'),cast('袁世凯·疲惫','right')]),D('徐世昌','国内没有人愿意替外国合同保卫皇位，国外也没有人愿意替皇位承担中国的战争。'),D('袁世凯·疲惫','写诏书吧。先撤帝制，再公布全部密约。这个账不能再藏在后人的国库里。'),N('外国承认电报只比撤销帝制诏书早到七小时。两个文件同时摆在案头：一张承认一个已经消失的帝国，一张要求未来几十年的中国继续偿还代价。'),
 S(bg.diplomatic,'1916年3月25日　北京','架空终幕',[],props.five),N('礼部人员拆下大殿龙徽，财政人员却仍在逐条核算利息。皇冠被收进库房，它的金色逐渐被借款合同、铁路图和抵押印章覆盖。'),N('多年以后，人们不再记得那份承认电报由谁签发，却仍能在关税账目上看见洪宪留下的数字。'),{t:'ending',kind:'gold',title:'金皇冠的账单',text:'你买到了承认，却没有买到忠诚；你撤销了皇位，却把它的价格留给了未来。'}],
 xian:()=>[
 S(bg.palace,'1916年5月2日　西安','架空结局',[cast('袁克定','left'),cast('袁世凯·疲惫','right')],props.dragon),N('袁世凯离开北京后，北洋元老在北京组织新的政治中枢。西安城墙升起龙旗，西京朝廷拥有宫殿、禁卫军、铸币局和真正控制的土地。'),N('这是四种可能中存在最久，也最接近真正王朝的一次。'),D('袁克定','父亲，只要守住西北，迟早可以重新东进。发行洪宪龙票，给地方将领封王，让他们提供军粮。'),
 DOC('government','西京分封诏','凡率军勤王者，许以王爵、世袭辖地及自筹军饷之权；克复东部后，再定全国官制。','洪宪元年·西京'),
 S(bg.palace,'1916年5月9日　西安','架空结局',[cast('徐世昌','left'),cast('袁世凯·疲惫','right')],props.dragon),D('徐世昌','东部税款已被截留，商人只收银元。地方将领接受王爵，也要求自己的地盘能够世袭。'),D('袁世凯·疲惫','只要他们还肯称臣。'),D('徐世昌','他们称臣，是因为臣字后面写着价格。今日封一个王换一车粮，明日便要封十个王换一支军队。'),
 S(bg.xian,'1916年5月16日　西安城内','架空结局',[cast('袁克定','left')],props.crowd),N('洪宪龙票开始发放军饷，三日后便只能折价购买粮食。城门外的商队宁愿绕道，也不愿把货物换成一张只在城墙内有效的纸。'),D('袁克定','查封拒收龙票的商铺！既是皇土之民，岂能不用皇朝钱币？'),N('当晚，更多粮店关门。禁卫军领到了双倍军饷，却买不到一斗涨价后的米。'),
 S(bg.palace,'1916年5月23日　西京朝会','架空结局',[cast('段祺瑞','left',true),cast('袁世凯·疲惫','right')],props.dragon),N('“北京愿意保证袁氏家属安全，也承认西北各军原有军籍。只要西安开城，战争即可停止。”——段祺瑞（电报）'),D('袁世凯·疲惫','他们是在劝降一个皇帝，还是接回一个旧总统？'),D('徐世昌','他们在给城里每个还想活下去的人一个选择。'),
 S(bg.palace,'1916年5月29日　西安','架空结局',[cast('袁克定','left'),cast('袁世凯·疲惫','right')],props.dragon),N('袁世凯病情加重后，禁卫军拥护袁克定继承皇位，地方将领却担心新君削夺权力。军械库方向响起枪声。'),D('袁克定','父亲，请立刻下诏传位。只要名分确定，军心就会稳定。'),D('袁世凯·疲惫','一个需要在炮声里抢先继承的皇位，传下去的不是天下，是围城。'),N('宫门外，禁卫军与地方部队互相架起机枪。双方都高呼勤王，却分别效忠两个尚未写进诏书的未来。'),
 S(bg.palace,'1916年6月1日　西安','架空结局',[cast('徐世昌','left'),cast('袁世凯·疲惫','right')]),D('袁世凯·疲惫','城还在，兵也还在。朕的天下呢？'),D('徐世昌','愿意服从的人已经走了。城墙再高，也围不出一个天下。'),D('袁世凯·疲惫','命守军谈判。先保百姓出城，再谈袁家。'),D('徐世昌','这会是陛下在西京最像一位君主的命令。'),
 S(bg.xian,'1916年6月2日　西安城门','架空终幕',[],props.five),N('凌晨，西安守军与北京代表达成协议：保留军籍并免于追究，条件是打开城门，交出国玺与袁氏皇族。龙旗缓缓降下，五色旗重新升起。'),N('没有人欢呼。士兵先放下枪，粮商随后推开门板，妇人提着篮子走向重新开张的米铺。存在最久的洪宪朝廷，就在一阵讨价还价和秤砣落案的声音里结束。'),N('袁世凯离开宫殿时回望城墙。那座曾被称作“西京”的城市仍在那里，街道、百姓与晨钟也都在那里；消失的只是那个试图把一座城称作天下的名字。'),{t:'ending',kind:'xian',title:'孤城无朝',text:'你建立了存在最久的洪宪朝廷，也亲手把它缩成了一座孤城。最后打开城门，才让城里的人重新拥有明天。'}]
};
function start(newRun=true){
 if(newRun){queue=commonStory();index=0;history=[];}
 else{
  const saved=JSON.parse(localStorage.getItem('hongxian-save')||'null');if(!saved)return start(true);
  queue=commonStory();history=[];
  for(const answer of (saved.history||[])){
   const at=queue.findIndex(x=>x.t==='choice');if(at<0)break;
   const more=queue[at].go(answer)||[];queue.splice(at,1,...more);
  }
  index=Math.min(saved.index,queue.length-1);restoreSceneAt(index);
 }
 hideAll();render();
}
function restoreSceneAt(at){for(let i=at;i>=0;i--){const n=queue[i];if(n?.t==='s'){background.src=n.image;$('#date').textContent=n.date;$('#tag').textContent=n.tag;renderCast(n.cast||[]);renderProp(n.prop);break}}}
function save(){localStorage.setItem('hongxian-save',JSON.stringify({index,history,at:Date.now()}));}
function hideAll(){states.forEach(x=>x.hidden=true);advance.hidden=true;game.classList.remove('speaker-left','speaker-right');}
function setScene(n){background.src=n.image;$('#date').textContent=n.date;$('#tag').textContent=n.tag;renderCast(n.cast||[]);renderProp(n.prop);next();}
function displayName(name){return name.startsWith('袁世凯')?'袁世凯（你）':name.replace(/·.*/,'')}
function renderCast(list){chars.innerHTML='';list.forEach(c=>{const d=document.createElement('div');d.className=`character ${c.side}${c.voice?' voice':''}`;d.dataset.name=c.name;const img=document.createElement('img');img.src=people[c.name];img.alt=displayName(c.name);const lab=document.createElement('div');lab.className='nameplate';lab.innerHTML=displayName(c.name)+(c.voice?'<small>画外音</small>':'');d.append(img,lab);chars.append(d);});}
function renderProp(p){propLayer.innerHTML='';if(!p)return;const img=document.createElement('img');img.src=p;img.alt='';img.className=p.includes('crowd')||p.includes('silhouette')?'prop-crowd':p.includes('flag')?'prop-flag':'prop-map';propLayer.append(img);}
function render(){hideAll();const n=queue[index];if(!n){showTitle();return;}$('#progress i').style.width=`${Math.min(100,(index/Math.max(queue.length,1))*100)}%`;save();if(n.t==='s'){setScene(n);return;}if(n.t==='y'){const el=$('#year-card');el.hidden=false;$('#year-text').textContent=n.year;advance.hidden=false;return;}if(n.t==='n'){const el=$('#narration-state');el.hidden=false;$('#narration-text').textContent=n.text;dimCast();advance.hidden=false;speakLine(n.text,'旁白');return;}if(n.t==='d'){const el=$('#dialogue-state');el.hidden=false;$('#dialogue-text').textContent=n.text;const who=[...chars.children].find(x=>x.dataset.name===n.speaker);[...chars.children].forEach(x=>x.classList.toggle('active',x===who));const side=who?.classList.contains('right')||who?.classList.contains('center-right')?'right':'left';game.classList.add('speaker-'+side);advance.hidden=false;speakLine(n.text,n.speaker);return;}if(n.t==='doc'){showDoc(n);return;}if(n.t==='choice'){showChoice(n);return;}if(n.t==='ending'){showEnding(n);return;}}
function dimCast(){[...chars.children].forEach(x=>x.classList.remove('active'));}
function next(){if(queue[index]?.t!=='choice'&&queue[index]?.t!=='ending'){index++;render();}}
function showDoc(n){$('#document-state').hidden=false;$('#document-image').src=docs[n.kind];$('#document-image').alt=n.title;$('#document-kicker').textContent=n.kicker;$('#document-title').textContent=n.title;$('#document-text').textContent=n.text;dimCast();speakLine(`${n.title}。${n.text}`,'旁白');}
function showChoice(n){$('#choice-state').hidden=false;$('#choice-question').textContent=n.question;dimCast();speakLine(n.question,'旁白');const box=$('#choice-buttons');box.innerHTML='';n.options.forEach((o,i)=>{const b=document.createElement('button');b.className='choice-button';b.innerHTML=`<b>${i+1}</b><span>${o}</span>`;b.onclick=()=>choose(i);box.append(b);});}
function choose(i){const n=queue[index];if(n?.t!=='choice')return;const more=n.go(i)||[];queue.splice(index,1,...more);render();}
function showEnding(n){currentEnding=n.kind;$('#ending-state').hidden=false;$('#ending-title').textContent=n.title;$('#ending-text').textContent=n.text;speakLine(`${n.title}。${n.text}`,'旁白');localStorage.removeItem('hongxian-save');}
function showTitle(){hideAll();stopVoice();background.src=bg.montage;$('#date').textContent='';$('#tag').textContent='';chars.innerHTML='';propLayer.innerHTML='';$('#title-card').hidden=false;$('#continue-game').hidden=!localStorage.getItem('hongxian-save');}
function showSummary(){hideAll();background.src=bg.map;chars.innerHTML='';propLayer.innerHTML='';$('#date').textContent='真实历史';$('#tag').textContent='课堂总结';$('#summary-state').hidden=false;$('#summary-copy').innerHTML=`<p>在真实历史中，袁世凯于1916年3月22日宣布取消帝制。洪宪帝制最终只维持了短暂时间。它的失败，并不能简单归结为某一场战斗、某一个人的背叛或某一次错误选择。</p><p>一、辛亥革命终结君主专制以后，共和已经成为新的政治承诺。民国虽然并不成熟，世袭皇权却已经失去原有的正当性。</p><p>二、筹安会、请愿和国体投票可以制造一致拥戴的表象，却不能代替真实民意。被控制的程序无法产生真正认同。</p><p>三、北洋军服从军令、军饷和旧有关系，并不等于愿意效忠袁氏王朝。个人威望无法自动转化为世袭制度的忠诚。</p><p>四、列强关心的是稳定、债务和在华利益。外国的暂时观望或承认，不能替帝制创造国内支持。</p><p>五、护国战争的意义不只在战场胜负。帝制使地方实力派、共和派、商会、知识分子和部分北洋将领找到了共同的反对目标。</p><p>选择可以改变洪宪帝制失败的时间、方式和代价。但仪式不能代替民意，武力不能制造忠诚，外国承认不能创造国内合法性。</p><p class="final">已经失去社会基础与政治认同的帝制，不可重来。</p>`;}
function showCurtain(){hideAll();background.src=bg.stage;$('#date').textContent='';$('#tag').textContent='';const el=$('#curtain-state');el.hidden=false;el.classList.remove('closed');const order=['袁世凯·龙袍','杨度','袁克定','梁启超','蔡锷','冯国璋','段祺瑞','徐世昌','芮恩施'];$('#cast').innerHTML=order.map(x=>`<img src="${people[x]}" alt="${x.replace(/·.*/,'')}">`).join('');}
advance.onclick=()=>{ensureAudio();next()};$('#document-continue').onclick=()=>{ensureAudio();next()};$('#new-game').onclick=()=>{ensureAudio();start(true)};$('#continue-game').onclick=()=>{ensureAudio();start(false)};$('#history-btn').onclick=showSummary;$('#restart-btn').onclick=()=>start(true);$('#title-btn').onclick=showTitle;$('#curtain-btn').onclick=showCurtain;$('#again-btn').onclick=()=>start(true);$('#end-btn').onclick=()=>{$('#curtain-state').classList.add('closed');setTimeout(showTitle,1500)};
$('#music-btn').onclick=()=>{musicEnabled=!musicEnabled;$('#music-btn').textContent=`音乐·${musicEnabled?'开':'关'}`;$('#music-btn').setAttribute('aria-pressed',String(musicEnabled));musicEnabled?(ensureAudio(),startMusic()):stopMusic();};
$('#voice-btn').onclick=()=>{voiceEnabled=!voiceEnabled;$('#voice-btn').textContent=`语音·${voiceEnabled?'开':'关'}`;$('#voice-btn').setAttribute('aria-pressed',String(voiceEnabled));if(!voiceEnabled)stopVoice();else{ensureAudio();const n=queue[index];if(n?.t==='d')speakLine(n.text,n.speaker);else if(n?.text)speakLine(n.text,'旁白');}};
$('#font-btn').onclick=()=>{fontLarge=!fontLarge;document.documentElement.style.setProperty('--scale-font',fontLarge?'1.14':'1');};$('#fullscreen-btn').onclick=()=>document.fullscreenElement?document.exitFullscreen():game.requestFullscreen?.();
document.addEventListener('keydown',e=>{const n=queue[index];if(n?.t==='choice'&&/^[1-4]$/.test(e.key)){const i=+e.key-1;if(i<n.options.length)choose(i);}else if((e.key==='Enter'||e.key===' ')&&!advance.hidden){e.preventDefault();next();}});
showTitle();
})();
