async function logout(req, res){
    try {
        const cookieOptions = {
            http : true,
            secure : true
        }

        return res.cookie('token', '', cookieOptions).status(200).json({
            message : "session out",
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}

module.exports = logout