import { useSelector } from "react-redux"
import { selectCurrentUser, selectCurrentToken } from "../../redux/feature/auth/authSlice"
import { Link } from "react-router-dom";


const Hublocal = () => {
    const user = useSelector(selectCurrentUser)
    const token = useSelector(selectCurrentToken)

    const welcome = user ? `Welcome ${user}!` : 'Welcome!'
    const tokenAbbr = `${token?.slice(0, 9)}...`

    const content = (
        <section className="welcome">

        </section>
    )
    return (
        <div>Welcome</div>
    )
}
export default Hublocal;