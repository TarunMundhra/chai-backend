class ApiError extends Error{
    constructor(
        StatusCode,
        message = "Something went wrong",
        error = [],
        stack = ""
    ){
        super(message)
        this.Statuscode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack){ 
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}
