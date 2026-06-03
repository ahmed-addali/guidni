#!/bin/bash

# مسار المشروع
PROJECT_DIR="$HOME/Desktop/projects/guidni-pfe/planner-agent"
# كلمة السر متاعك
MY_PASS="13506602"

# 1. النافذة الرئيسية (على اليسار) - الـ Backend 
# باش يستنى 8 ثواني كاملين باش الـ Docker ياخو وقتو
tilix --title "Uvicorn Backend" -w "$PROJECT_DIR" -e "bash -c 'echo \"Waiting for Qdrant...\"; sleep 8; source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env --log-level debug --reload; exec bash'" &
sleep 0.5

# 2. نقسمو الشاشة على اليمين (الفوق) - الـ Recommendation API
# زدنا --env-file .env باش ما عادش يضيع الـ DATABASE_URL
tilix --action session-add-right --title "Recommendation API" -w "$PROJECT_DIR" -e "bash -c 'echo \"Starting Recommendation API...\"; sleep 4; source venv/bin/activate && uvicorn app.reco.recommendation_router:app --host 0.0.0.0 --port 8001 --env-file .env --log-level debug --reload; exec bash'" &
sleep 0.5

# 3. نقسمو الشاشة اللي على اليمين (في الوسط) - Docker Qdrant
# هذا يبدا يخدم ديركت من غير حتى Sleep
tilix --action session-add-down --title "Docker/Qdrant" -e "bash -c 'echo $MY_PASS | sudo -S docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant; exec bash'" &
sleep 0.5

# 4. نقسمو الشاشة اللي على اليمين (اللوطا) - Phoenix Server
tilix --action session-add-down --title "Phoenix Server" -w "$PROJECT_DIR" -e "bash -c 'echo \"Starting Phoenix...\"; sleep 2; source venv/bin/activate && python3 -m phoenix.server.main serve; exec bash'" &

echo "🚀 All panes created! Waiting for services to boot up properly in order..."