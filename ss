[1mdiff --git a/sistema/frontend/src/styles/pos.css b/sistema/frontend/src/styles/pos.css[m
[1mindex 6dd9d4a..4a0ade4 100644[m
[1m--- a/sistema/frontend/src/styles/pos.css[m
[1m+++ b/sistema/frontend/src/styles/pos.css[m
[36m@@ -612,7 +612,16 @@[m
   margin: 0;[m
   text-align: center;[m
   color: #666666;[m
[31m-  font-size: 9px;[m
[32m+[m[32m  font-size: 8.5px;[m
[32m+[m[32m  line-height: 1.3;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pos-ticket-credito {[m
[32m+[m[32m  margin: 2px 0 0;[m
[32m+[m[32m  text-align: center;[m
[32m+[m[32m  color: #888888;[m
[32m+[m[32m  font-size: 8px;[m
[32m+[m[32m  line-height: 1.25;[m
 }[m
 [m
 .pos-ticket-marca {[m
[36m@@ -723,6 +732,8 @@[m
     margin: 0;[m
     padding: 0;[m
     box-shadow: none;[m
[32m+[m[32m    break-inside: avoid;[m
[32m+[m[32m    page-break-inside: avoid;[m
   }[m
 [m
   .modal-acciones,[m
