import { useEffect } from "react";
import Passwordless from "supertokens-web-js/recipe/passwordless";

const ConsumeSuperTokensMagicLink = () => {
    useEffect(() => {
        Passwordless.consumeCode()
            .then((resp) => {
                if(resp.status === "OK") {
                    window.location.assign("/");
                } else {
                    window.alert("Login failed.");
                    window.location.assign("/login");
                }
            })
            .catch((err) => {
                if(err.isSuperTokensGeneralError === true) {
                    window.alert(err.message);
                } else {
                    window.alert("Something went wrong");
                }
            })
    }, []);

    return(
        <p>Loading...</p>
    )
}

export default ConsumeSuperTokensMagicLink;
