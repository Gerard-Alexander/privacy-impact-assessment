const fs = require('fs');
const path = require('path');

const saveHeatmap = async (req, res) => {
    try {
        const { image, type, assessmentId } = req.body;
        if (!image || !type || !assessmentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Clean base64 data
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        
        const uploadsDir = path.join(__dirname, '..', '..', 'exports', 'heatmaps');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${assessmentId}-${type}.png`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');
        
        return res.json({ success: true, path: `/exports/heatmaps/${fileName}` });
    } catch (error) {
        console.error('Error saving heatmap:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { saveHeatmap };
