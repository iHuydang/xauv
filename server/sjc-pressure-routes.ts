
import express from 'express';
import { sjcIndirectPressureSystem } from './sjc-indirect-pressure-system';

const router = express.Router();

// Endpoint chính để thực hiện tấn công áp lực gián tiếp
router.post('/sjc/indirect-pressure', async (req, res) => {
  try {
    const { intensity = 'HIGH' } = req.body;
    
    console.log(`🚨 API: Nhận yêu cầu tấn công áp lực SJC gián tiếp`);
    
    const pressureId = await sjcIndirectPressureSystem.executeIndirectPressure(intensity);
    
    res.json({
      success: true,
      data: {
        pressure_id: pressureId,
        intensity,
        message: 'Tấn công áp lực gián tiếp SJC đã được khởi động',
        target: 'Buộc SJC giảm chênh lệch với giá vàng thế giới',
        methods: [
          'Khai thác arbitrage',
          'Tấn công hệ thống định giá',
          'Tạo áp lực tài chính',
          'Escalation phối hợp'
        ]
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi thực hiện tấn công áp lực SJC',
      message: error.message
    });
  }
});

// Lấy trạng thái các cuộc tấn công đang hoạt động
router.get('/sjc/active-pressures', async (req, res) => {
  try {
    const activePressures = sjcIndirectPressureSystem.getActivePressures();
    
    res.json({
      success: true,
      data: {
        active_count: activePressures.length,
        pressures: activePressures.map(p => ({
          pressure_id: p.pressureId,
          status: p.status,
          duration: Date.now() - p.startTime.getTime(),
          financial_impact: p.financialImpact.estimatedLoss,
          sjc_response: p.sjcResponse
        }))
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy trạng thái tấn công'
    });
  }
});

// Lấy trạng thái hệ thống
router.get('/sjc/system-status', async (req, res) => {
  try {
    const status = await sjcIndirectPressureSystem.getSystemStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy trạng thái hệ thống'
    });
  }
});

// Quick attack với tham số tùy chỉnh
router.post('/sjc/quick-pressure', async (req, res) => {
  try {
    const { 
      intensity = 'HIGH',
      target_gap_percent = 2.0,
      duration_minutes = 10
    } = req.body;
    
    console.log(`⚡ Quick Pressure Attack: ${intensity} trong ${duration_minutes} phút`);
    
    const pressureId = await sjcIndirectPressureSystem.executeIndirectPressure(intensity);
    
    res.json({
      success: true,
      data: {
        pressure_id: pressureId,
        target: `Giảm chênh lệch SJC xuống dưới ${target_gap_percent}%`,
        estimated_duration: `${duration_minutes} phút`,
        attack_type: 'Quick Indirect Pressure'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi quick pressure attack'
    });
  }
});

export default router;
