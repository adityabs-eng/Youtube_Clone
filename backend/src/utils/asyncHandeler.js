
//<---------   Async Handler to handle errors in async functions(act as a wrapper function) --------->
export const asyncHandeler = (requestHandler) =>{
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((error) => {next(error);});
    }
};




/* 
<---------   Alternative Implementation ---------> 
const asyncHandler = (fn) => async (req, res, next) => 
{
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
 
export default asyncHandler;
*/