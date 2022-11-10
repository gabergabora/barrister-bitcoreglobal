const withdrawRequest = function(name,amount){
    return `
    
    <div class="container px-0 my-0 mx-auto" style=" max-width: 600px; margin: 0 auto;">
    <header style=" background-color: #2f4b7a; width:100%; display: flex; text-align: center; justify-content: center; align-items: center; padding: 16px 0;">
    <img src="https://www.bendigotrades.com/assets/images/logo.png" alt="BendigoTrades logo" 
    style=" 
    height: 30px;
    display: inline-block;"
    >
    <h4 style="color: white;">Bendigo global</h4>
    </header>
    
        <div class="content me-4 mb-4" style="
            margin-top: 20px;
            
            padding-left: 1rem;
            max-width: 400px;
        ">
            <p style="color: #2f4b7a; margin-bottom:14px; font-size:30px;text-transform: capitalize;"> Hi ${name},</p>
            <p style="color: #2f4b7a; font-weight: 400; font-size: 14px;"> You requested to withdrawal a total of $${amount}
             from your account. This request will be confirmed within 24 hours.
            </p>
            <small style="display: block; margin-top : 20px; color: #2f4b7a;">Please report this transaction immediately if it was not placed by you.</small>
        </div>
        <footer style="background-color: #2f4b7a; margin-top: 20px ; padding : 20px 0; display: flex; align-items: center; color: white;">
        <a href="https://bendigotrades.com"  style="margin: 0 1rem; display: block; color: white; text-decoration: none;"> Home </a>
        <a href="https://bendigotrades.com/about"  style="margin: 0 1rem; display: block; color: white; text-decoration: none;"> About </a>
        <a href="https://bendigotrades.com/login"  style="margin: 0 1rem; display: block; color: white; text-decoration: none;"> Login </a>
        </footer>
    </div>
    `
}


module.exports = { withdrawRequest}