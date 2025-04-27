import cron from "node-cron";
import { generateExpiryAlerts } from "./generate-expiry-alerts";

// */5 * * * * * 테스트용 5초마다 실행행

let batchStarted = false;

export function startBatchJobs(){
    if (batchStarted) return; // 서버 재시작하거나 핫 리로딩 시 중복 실행 방지
    batchStarted = true;

    // 매일 새벽 1시에 실행
    cron.schedule("0 1 * * *", async () => {
      console.log("[Batch] 유통기한 알림 생성 중...");
      await generateExpiryAlerts(7);
      console.log("[Batch] 완료");
    });
}
