import React,{Component} from 'react'
import axios from 'axios/index'
import Message from './Message'
import Cookies from 'universal-cookie'
import {v4 as uuid} from 'uuid'
import Card from './Card'
import QuickReplies from './QuickReplies'
import {withRouter} from 'react-router-dom'

const cookies=new Cookies();

class Chatbot extends Component{
  messagesEnd;
constructor(props){
  super(props);
  this.handleInput=this.handleInput.bind(this)
  this._handleQuickReplyPayload=this._handleQuickReplyPayload.bind(this)
 this.show=this.show.bind(this)
 this.hide=this.hide.bind(this)
  this.state={
    messages:[],
    showBot:true,
    shopWelcomeSent:false
  }
  if(cookies.get('userID')===undefined){
  cookies.set('userID',uuid(),{path:'/'})
}
console.log(cookies.get('userID'));
}

async df_text_query(queryText){
  let says={
    speaks:'user',
    msg:{
      text:{
        text:queryText
      }
    }
  }
  this.setState({messages:[...this.state.messages,says]})
try{  const res=await axios.post('/api/df_text_query',{text:queryText,userID:cookies.get('userID')})

  for(let msg of res.data.fulfillmentMessages){
// console.log(JSON.stringify(msg));
    says={
      speaks:'bot',
      msg:msg
    }
    this.setState({messages:[...this.state.messages,says]})

  }
}catch(e){
  says={
    speaks:'bot',
    msg:{
      text:{
        text:"I'm having troubles.I need to terminate.Will be back later"
      }
    }
  }
  this.setState({messages:[...this.state.messages,says]})
  let that=this;
  setTimeout(function(){
    that.setState({showBot:false})
  },2000)
}
}


async df_event_query(queryEvent){
try{
  const res=await axios.post('/api/df_event_query',{event:queryEvent,userID:cookies.get('userID')})
  for(let msg of res.data.fulfillmentMessages){
  let says={
      speaks:'bot',
      msg:msg
    }
    this.setState({messages:[...this.state.messages,says]})

  }
}catch(e){
  let says={
    speaks:'bot',
    msg:{
      text:{
        text:"I'm having troubles.I need to terminate.Will be back later"
      }
    }
  }
  this.setState({messages:[...this.state.messages,says]})
  let that=this;
  setTimeout(function(){
    that.setState({showBot:false})
  },2000)

}
}

 resolveAfterXSeconds(x){
  return new Promise(resolve=>{
    setTimeout(()=>{
resolve(x);
    },x*1000)
  })

}

async componentDidMount(){
  this.df_event_query('Welcome')
  if(window.location.pathname==='/shop' &&!this.state.shopWelcomeSent){
await this.resolveAfterXSeconds(1);
    this.df_event_query('WELCOME_SHOP')
this.setState({shopWelcomeSent:true,showBot:true})
  }

  this.props.history.listen(()=>{
    console.log("listening");
if(this.props.history.location.pathname==='/shop'&&!this.state.shopWelcomeSent){
  this.df_event_query('WELCOME_SHOP')
this.setState({shopWelcomeSent:true,showBot:true})
}
  })

}


componentDidUpdate(){
this.messagesEnd.scrollIntoView({behaviour:"smooth"})
if(this.talkInput){
  this.talkInput.focus()
}
}

show(e){
  e.preventDefault()
  e.stopPropagation()
  this.setState({showBot:true})
}

hide(e){
  e.preventDefault()
  e.stopPropagation()
  this.setState({showBot:false})
}

_handleQuickReplyPayload(e,payload,text){
e.preventDefault()
e.stopPropagation()
switch (payload){
  case 'training_masterclass':this.df_event_query('MASTERCLASS')
  break;
  case 'recommended_yes':
  this.df_event_query('SHOW_RECOMMENDATIONS')
  default:
  this.df_text_query(text)
   break;

}
}


renderCards(cards){
return cards.map((card,i)=> <Card key={i} payload={card.structValue}/>);
}

renderOneMessage(message,i){
  if(message.msg&&message.msg.text&&message.msg.text.text){
  return <Message key={i} speaks={message.speaks} text={message.msg.text.text}/>
  }else if (message.msg&&message.msg.payload.fields.cards){
return <div key={i} >
    <div className="card-panel grey-lighten-5 z-depth-1">
   <div style={{overflow:'hidden'}}>
     <div className="col s2">
     <a className="btn-floating btn-large waves-effect waves-light red" href="/">{message.speaks}</a>
     </div>

      <div style={{overflow:'auto',overflowY:'scroll'}}>
              <div style={{height:300,width:message.msg.payload.fields.cards.listValue.length*270}}>
                { this.renderCards(message.msg.payload.fields.cards.listValue.values)}
              </div>
        </div>
   </div>
    </div>
  </div>
}else if(message.msg&&
         message.msg.payload&&
         message.msg.payload.fields&&
         message.msg.payload.fields.quick_replies

){
  return <QuickReplies
     text={message.msg.payload.fields.text?message.msg.payload.fields.text:null}
     key={i}
     replyClick={this._handleQuickReplyPayload}
     speaks={message.speaks}
     payload={message.msg.payload.fields.quick_replies.listValue.values}
    />
}

  }



renderMessages(stateMessages){
if(stateMessages){
  return stateMessages.map((message,i)=>{

return this.renderOneMessage(message,i)

  })
}else{
  return null;
}
}


handleInput(e){
if(e.key==='Enter'){
  this.df_text_query(e.target.value)
  e.target.value=''
}
}

  render(){
    if(this.state.showBot){
    return (
        <div style={{minHeight:500,maxHeight:470,height:500,width:400,position:'absolute',bottom:0,right:0,border:'1px solid lightgrey'}}>
             <nav>
               <div className="nav-wrapper">
                 <a href="/" className="brand-logo">ChatBot</a>
                <ul id="nav-mobile" className="right hide-on-med-and-down">
                   <li><a href="/" onClick={this.hide}>Close</a></li>
                </ul>
               </div>
             </nav>
          <div id='chatbot' style={{minHeight:388,maxHeight:388,width:'100%',overflow:'auto'}}>
            {this.renderMessages(this.state.messages)}
            <div
              ref={(el)=>{this.messagesEnd=el;}}
              style={{float:'left',clear:'both'}}>
            </div>
          </div>
      <div className="col s2">
        <input style={{margin:0,paddingLeft:'1%',paddingRight:'1%',width:'98%'}} placeholder="type a message" type="text" onKeyPress={this.handleInput}/>

      </div>

        </div>
      )
  }
  else{
    return (
        <div style={{marginHeight:40,maxHeight:500,width:400,position:'absolute',bottom:0,right:0,border:'1px solid lightgrey'}}>
             <nav>
               <div className="nav-wrapper">
                 <a href="/" className="brand-logo">ChatBot</a>
                   <ul id="nav-mobile" className="right hide-on-med-and-down">
                      <li><a href="/" onClick={this.show}>Show</a></li>
                   </ul>
             </div>
              </nav>
             <div
               ref={(el)=>{this.messagesEnd=el;}}
               style={{float:'left',clear:'both'}}>
             </div>



        </div>
      )
  }
}}



//can listen history
export default withRouter(Chatbot)
