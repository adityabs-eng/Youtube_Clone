class ApiError extends Error {
  constructor(
    statusCode, 
    message="something went wrong",
    errors=[],
    stack=""
  ) {
    super(message); // calling parent class constructor
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // if stack is provided use it otherwise generate a new stack trace
    //useful for testing purposes
    if (stack) {
      this.stack = stack;
    }else {
      Error.captureStackTrace(this, this.constructor);
    }   
  }
}

export { ApiError };