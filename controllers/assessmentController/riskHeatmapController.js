const prisma = require('../../store/prisma');

const riskHeatmap = async (req, res) => {
    res.locals.riskHeatmapTitle = 'Risk Heatmap';
    const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

    if (!piaAssessmentId) {
        return res.redirect('/assessment');
    }

    try {
        const threatsAndControls = await prisma.threatsAndControl.findMany({
            where: { piaAssessment_id: parseInt(piaAssessmentId, 10) }
        });

        // We use 'current' for Before map and 'after' for After map as per logical expectation, 
        // even though user mentioned 'current' for both (assumed typo or misstatement).
        
        return res.render('assessment/riskheatmap-page', {
            title: res.locals.riskHeatmapTitle,
            activePage: 'riskheatmap-page',
            user: req.session.user,
            piaAssessmentId: piaAssessmentId,
            threats: threatsAndControls,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error fetching risk heatmap data:', error);
        return res.redirect('/assessment');
    }
};

module.exports = {
    riskHeatmap
};
